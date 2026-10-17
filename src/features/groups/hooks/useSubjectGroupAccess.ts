import { useEffect, useState } from 'react';

import { resolveMembershipState, type MembershipKind } from '../services/membership';
import { useGroupsStore } from '../store';
import type { Group } from '../types';

export type SubjectGroupAccess = {
  status: 'loading' | 'member' | 'pending' | 'none';
  /** The subject's group the student belongs to (or asked to join), when there is one. */
  group: Group | null;
  /** Membership of `group` (`notMember` when the student has no group for this subject). */
  membership: MembershipKind;
};

function subjectIdOf(group: Group): string | null {
  const subject = group.subject;
  if (subject === null || subject === undefined) return null;
  if (typeof subject === 'object') {
    const id = (subject as { id?: unknown }).id;
    return id === undefined || id === null ? null : String(id);
  }
  return String(subject);
}

/**
 * Lectures and files of a subject open only to approved members of that subject's group. This reads
 * the student's own groups (loaded once) and reports whether the student is a member, has a request
 * waiting for approval, or has not joined. The server enforces the same rule.
 */
export function useSubjectGroupAccess(subjectId: string | number): SubjectGroupAccess {
  const myGroups = useGroupsStore((state) => state.myGroups);
  const loadMyGroups = useGroupsStore((state) => state.loadMyGroups);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let active = true;
    loadMyGroups()
      .catch(() => undefined)
      .finally(() => {
        if (active) setLoaded(true);
      });

    return () => {
      active = false;
    };
  }, [loadMyGroups]);

  const wanted = String(subjectId);
  const related = myGroups.filter((group) => subjectIdOf(group) === wanted);
  const member = related.find((group) => resolveMembershipState(group).kind === 'member');
  if (member) return { status: 'member', group: member, membership: 'member' };

  const pending = related.find((group) => resolveMembershipState(group).kind === 'pending');
  if (pending) return { status: 'pending', group: pending, membership: 'pending' };

  // A blocked/rejected/left group is reported so the locked card can say why.
  const other =
    related.find((group) => resolveMembershipState(group).kind === 'blocked') ??
    related.find((group) => resolveMembershipState(group).kind === 'rejected') ??
    related.find((group) => resolveMembershipState(group).kind === 'left') ??
    null;

  return {
    status: loaded ? 'none' : 'loading',
    group: other,
    membership: other ? resolveMembershipState(other).kind : 'notMember',
  };
}
