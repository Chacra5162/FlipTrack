/**
 * teams.js – Multi-user team support
 * Handles team creation, invite codes, joining, role management,
 * and active-account switching for shared inventory.
 */

import { getSupabaseClient, getCurrentUser } from '../data/auth.js';
import { escHtml, escAttr } from '../utils/format.js';
import { toast, trapFocus, releaseFocus } from '../utils/dom.js';

// ── TEAM STATE ───────────────────────────────────────────────────────────────
let _team     = null;   // { id, name, owner_id, created_at }
let _members  = [];     // [{ id, user_id, role, joined_at, email }]
let _myRole   = null;   // 'owner' | 'editor' | 'viewer' | null (solo)
let _activeAccountId = null; // whose data are we viewing? (team owner or self)

export function getActiveAccountId() {
  const user = getCurrentUser();
  return _activeAccountId || (user ? user.id : null);
}

export function getMyRole() { return _myRole; }
export function getTeam()   { return _team; }

/**
 * Boot: called at session start. Checks if user is on a team and loads it.
 */
export async function initTeam() {
  const sb = getSupabaseClient();
  const user = getCurrentUser();
  if (!sb || !user) { _reset(); return; }

  try {
    // Check if user is a member of any team
    const { data: memberships, error } = await sb
      .from('ft_team_members')
      .select('team_id, role')
      .eq('user_id', user.id)
      .limit(1);

    if (error || !memberships || !memberships.length) {
      _reset();
      _activeAccountId = user.id;
      return;
    }

    const membership = memberships[0];
    _myRole = membership.role;

    // Load team details
    const { data: teams } = await sb
      .from('ft_teams')
      .select('*')
      .eq('id', membership.team_id)
      .single();

    if (teams) {
      _team = teams;
      _activeAccountId = teams.owner_id;
    } else {
      _reset();
      _activeAccountId = user.id;
    }
  } catch (e) {
    console.warn('FlipTrack: team init error:', e.message);
    _reset();
    _activeAccountId = user?.id || null;
  }
}

function _reset() {
  _team = null;
  _members = [];
  _myRole = null;
}

// ══════════════════════════════════════════════════════════════════════════
// TEAM CREATION
// ══════════════════════════════════════════════════════════════════════════

export async function createTeam(name) {
  const sb = getSupabaseClient();
  const user = getCurrentUser();
  if (!sb || !user) { toast('Please sign in first', true); return; }
  if (_team) { toast('You are already on a team', true); return; }

  const trimmed = (name || '').trim();
  if (!trimmed) { toast('Team name is required', true); return; }

  try {
    // Create team
    const { data: team, error: e1 } = await sb
      .from('ft_teams')
      .insert({ name: trimmed, owner_id: user.id })
      .select()
      .single();
    if (e1) throw new Error(e1.message);

    // Add self as owner member
    const { error: e2 } = await sb
      .from('ft_team_members')
      .insert({ team_id: team.id, user_id: user.id, role: 'owner' });
    if (e2) throw new Error(e2.message);

    _team = team;
    _myRole = 'owner';
    _activeAccountId = user.id;

    toast('Team created ✓');
    renderTeamPanel();
  } catch (e) {
    console.error('FlipTrack: createTeam error:', e);
    toast('Failed to create team: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// INVITE CODES
// ══════════════════════════════════════════════════════════════════════════

function _genCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 for clarity
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function generateInvite(role = 'editor') {
  const sb = getSupabaseClient();
  if (!sb || !_team || _myRole !== 'owner') {
    toast('Only the team owner can generate invites', true);
    return null;
  }

  try {
    const code = _genCode();
    const { data, error } = await sb
      .from('ft_team_invites')
      .insert({ team_id: _team.id, code, role })
      .select()
      .single();
    if (error) throw new Error(error.message);

    toast('Invite code: ' + code);
    return data;
  } catch (e) {
    toast('Failed to create invite: ' + e.message, true);
    return null;
  }
}

// ══════════════════════════════════════════════════════════════════════════
// JOIN TEAM
// ══════════════════════════════════════════════════════════════════════════

export async function joinTeam(code) {
  const sb = getSupabaseClient();
  const user = getCurrentUser();
  if (!sb || !user) { toast('Please sign in first', true); return; }
  if (_team) { toast('Leave your current team first', true); return; }

  const trimmed = (code || '').trim().toUpperCase();
  if (!trimmed) { toast('Enter an invite code', true); return; }

  try {
    // Find valid invite
    const { data: invites, error: e1 } = await sb
      .from('ft_team_invites')
      .select('*')
      .eq('code', trimmed)
      .is('used_by', null)
      .gt('expires_at', new Date().toISOString())
      .limit(1);

    if (e1) throw new Error(e1.message);
    if (!invites || !invites.length) {
      toast('Invalid or expired invite code', true);
      return;
    }

    const invite = invites[0];

    // Add self as member
    const { error: e2 } = await sb
      .from('ft_team_members')
      .insert({ team_id: invite.team_id, user_id: user.id, role: invite.role });
    if (e2) {
      if (e2.code === '23505') toast('You are already on this team', true);
      else throw new Error(e2.message);
      return;
    }

    // Mark invite as used
    await sb
      .from('ft_team_invites')
      .update({ used_by: user.id })
      .eq('id', invite.id);

    // Reload team state
    await initTeam();
    toast('Joined team ✓');
    renderTeamPanel();
  } catch (e) {
    toast('Failed to join team: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// LEAVE TEAM
// ══════════════════════════════════════════════════════════════════════════

export async function leaveTeam() {
  const sb = getSupabaseClient();
  const user = getCurrentUser();
  if (!sb || !user || !_team) return;

  if (_myRole === 'owner') {
    toast('Transfer ownership before leaving, or delete the team', true);
    return;
  }

  try {
    const { error } = await sb
      .from('ft_team_members')
      .delete()
      .eq('team_id', _team.id)
      .eq('user_id', user.id);
    if (error) throw new Error(error.message);

    _reset();
    _activeAccountId = user.id;
    toast('Left team');
    renderTeamPanel();
  } catch (e) {
    toast('Failed to leave team: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// DELETE TEAM (owner only)
// ══════════════════════════════════════════════════════════════════════════

export async function deleteTeam() {
  const sb = getSupabaseClient();
  const user = getCurrentUser();
  if (!sb || !user || !_team || _myRole !== 'owner') return;

  if (!confirm('Delete this team? All members will be removed.')) return;

  try {
    const { error } = await sb
      .from('ft_teams')
      .delete()
      .eq('id', _team.id);
    if (error) throw new Error(error.message);

    _reset();
    _activeAccountId = user.id;
    toast('Team deleted');
    renderTeamPanel();
  } catch (e) {
    toast('Failed to delete team: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// UPDATE MEMBER ROLE
// ══════════════════════════════════════════════════════════════════════════

export async function updateMemberRole(memberId, newRole) {
  const sb = getSupabaseClient();
  if (!sb || _myRole !== 'owner') return;

  try {
    const { error } = await sb
      .from('ft_team_members')
      .update({ role: newRole })
      .eq('id', memberId);
    if (error) throw new Error(error.message);
    toast('Role updated ✓');
    await _loadMembers();
    renderTeamPanel();
  } catch (e) {
    toast('Failed to update role: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// REMOVE MEMBER
// ══════════════════════════════════════════════════════════════════════════

export async function removeMember(memberId) {
  const sb = getSupabaseClient();
  if (!sb || _myRole !== 'owner') return;

  try {
    const { error } = await sb
      .from('ft_team_members')
      .delete()
      .eq('id', memberId);
    if (error) throw new Error(error.message);
    toast('Member removed');
    await _loadMembers();
    renderTeamPanel();
  } catch (e) {
    toast('Failed to remove member: ' + e.message, true);
  }
}

// ══════════════════════════════════════════════════════════════════════════
// LOAD TEAM MEMBERS (with emails from profiles)
// ══════════════════════════════════════════════════════════════════════════

async function _loadMembers() {
  const sb = getSupabaseClient();
  if (!sb || !_team) { _members = []; return; }

  try {
    const { data, error } = await sb
      .from('ft_team_members')
      .select('id, user_id, role, joined_at')
      .eq('team_id', _team.id)
      .order('joined_at');
    if (error) throw new Error(error.message);

    // Fetch emails from profiles
    const userIds = data.map(m => m.user_id);
    const { data: profiles } = await sb
      .from('profiles')
      .select('id, email')
      .in('id', userIds);

    const emailMap = {};
    if (profiles) profiles.forEach(p => { emailMap[p.id] = p.email; });

    _members = data.map(m => ({ ...m, email: emailMap[m.user_id] || 'Unknown' }));
  } catch (e) {
    console.warn('FlipTrack: load members error:', e.message);
    _members = [];
  }
}

// ══════════════════════════════════════════════════════════════════════════
// TEAM UI — renders inside the account menu overlay
// ══════════════════════════════════════════════════════════════════════════

export async function openTeamPanel() {
  if (_team) await _loadMembers();
  const ov = document.getElementById('teamOv');
  if (ov) {
    renderTeamPanel();
    ov.style.display = 'flex';
    setTimeout(() => trapFocus('#teamOv'), 100);
  }
}

export function closeTeamPanel() {
  releaseFocus();
  const ov = document.getElementById('teamOv');
  if (ov) ov.style.display = 'none';
}

export function renderTeamPanel() {
  const container = document.getElementById('teamContent');
  if (!container) return;
  const user = getCurrentUser();
  if (!user) return;

  if (!_team) {
    // NO TEAM — show create/join UI
    container.innerHTML = `
      <div style="text-align:center;padding:12px 0 8px">
        <div style="font-size:24px;margin-bottom:4px">👥</div>
        <div style="font-size:13px;color:var(--text);font-weight:600;margin-bottom:4px">No Team Yet</div>
        <div style="font-size:11px;color:var(--muted);margin-bottom:16px">Create a team to share your inventory with others, or join an existing one.</div>
      </div>

      <div style="margin-bottom:16px">
        <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Create a Team</label>
        <div style="display:flex;gap:6px">
          <input type="text" id="teamNameInput" placeholder="Team name…" maxlength="40"
            style="flex:1;padding:8px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px">
          <button onclick="teamCreate()" style="padding:8px 14px;background:var(--accent);border:none;color:#000;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;cursor:pointer">Create</button>
        </div>
      </div>

      <div style="border-top:1px solid var(--border);padding-top:14px">
        <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Join a Team</label>
        <div style="display:flex;gap:6px">
          <input type="text" id="teamCodeInput" placeholder="Invite code…" maxlength="6"
            style="flex:1;padding:8px 10px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:12px;text-transform:uppercase;letter-spacing:2px;text-align:center">
          <button onclick="teamJoin()" style="padding:8px 14px;background:var(--accent);border:none;color:#000;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;cursor:pointer">Join</button>
        </div>
      </div>`;
    return;
  }

  // HAS TEAM — show team info, members, and management
  const isOwner = _myRole === 'owner';
  const roleLabel = { owner: '👑 Owner', editor: '✏️ Editor', viewer: '👁 Viewer' };

  let membersHtml = _members.map(m => {
    const isSelf = m.user_id === user.id;
    const label = escHtml(m.email) + (isSelf ? ' (you)' : '');
    const roleBadge = `<span style="font-size:10px;color:var(--muted)">${roleLabel[m.role] || m.role}</span>`;

    let actions = '';
    if (isOwner && !isSelf) {
      const nextRole = m.role === 'editor' ? 'viewer' : 'editor';
      const nextLabel = m.role === 'editor' ? '→ Viewer' : '→ Editor';
      actions = `
        <button onclick="teamUpdateRole('${escAttr(m.id)}','${escAttr(nextRole)}')" title="Change to ${nextLabel}"
          style="padding:2px 6px;background:var(--surface);border:1px solid var(--border);color:var(--muted);font-size:9px;cursor:pointer;font-family:'DM Mono',monospace">${nextLabel}</button>
        <button onclick="teamRemoveMember('${escAttr(m.id)}')" title="Remove from team"
          style="padding:2px 6px;background:var(--surface);border:1px solid var(--border);color:var(--danger);font-size:9px;cursor:pointer;font-family:'DM Mono',monospace">✕</button>`;
    }

    return `<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
      <div><div style="font-size:12px;color:var(--text)">${label}</div>${roleBadge}</div>
      <div style="display:flex;gap:4px">${actions}</div>
    </div>`;
  }).join('');

  let inviteSection = '';
  if (isOwner) {
    inviteSection = `
      <div style="margin-top:14px;border-top:1px solid var(--border);padding-top:14px">
        <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px;display:block;margin-bottom:6px">Invite Member</label>
        <div style="display:flex;gap:6px;align-items:center">
          <select id="teamInviteRole" style="padding:8px;background:var(--surface);border:1px solid var(--border);color:var(--text);font-family:'DM Mono',monospace;font-size:11px">
            <option value="editor">Editor</option>
            <option value="viewer">Viewer</option>
          </select>
          <button onclick="teamGenInvite()" style="flex:1;padding:8px 14px;background:var(--accent);border:none;color:#000;font-family:'DM Mono',monospace;font-size:11px;font-weight:700;cursor:pointer">Generate Invite Code</button>
        </div>
        <div id="teamInviteResult" style="margin-top:8px"></div>
      </div>`;
  }

  let leaveBtn = '';
  if (isOwner) {
    leaveBtn = `<button onclick="teamDelete()" style="padding:8px 14px;background:none;border:1px solid var(--danger);color:var(--danger);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;width:100%">Delete Team</button>`;
  } else {
    leaveBtn = `<button onclick="teamLeave()" style="padding:8px 14px;background:none;border:1px solid var(--danger);color:var(--danger);font-family:'DM Mono',monospace;font-size:11px;cursor:pointer;width:100%">Leave Team</button>`;
  }

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
      <div>
        <div style="font-size:15px;font-weight:700;color:var(--text)">${escHtml(_team.name)}</div>
        <div style="font-size:10px;color:var(--muted)">${_members.length} member${_members.length !== 1 ? 's' : ''} · Your role: ${roleLabel[_myRole] || _myRole}</div>
      </div>
    </div>

    <div style="margin-bottom:4px">
      <label style="font-size:10px;color:var(--muted);text-transform:uppercase;letter-spacing:1px">Members</label>
      ${membersHtml}
    </div>

    ${inviteSection}

    <div style="margin-top:16px">${leaveBtn}</div>`;
}
