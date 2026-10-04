import {
  resolveNotificationRouteIntent,
  resolveTargetFromData,
} from '../notificationRoutingService';

/**
 * The payload keys below are the ones the backend actually sends (see the `data={...}`
 * arguments in its printing/support/groups/verification services). Routing previously
 * looked for `target_type`/`target_id`, which no producer ever sets, so every
 * notification resolved to "no route" and opened nothing.
 */
describe('notification routing against real backend payloads', () => {
  it('routes a print order status notification to that order', () => {
    const target = resolveTargetFromData({ print_order_id: 42, status: 'processing' });

    expect(target).toEqual({ targetType: 'printing', targetId: 42 });
    expect(resolveNotificationRouteIntent(target)).toEqual({ kind: 'printingOrder', orderId: 42 });
  });

  it('routes a support ticket notification to that ticket', () => {
    const target = resolveTargetFromData({ support_ticket_id: 7, status: 'answered' });

    expect(resolveNotificationRouteIntent(target)).toEqual({ kind: 'supportTicket', ticketId: 7 });
  });

  it('routes a group membership notification to that group', () => {
    const target = resolveTargetFromData({ group_id: 3, membership_id: 11, status: 'approved' });

    expect(resolveNotificationRouteIntent(target)).toEqual({ kind: 'group', groupId: 3 });
  });

  it('routes a verification notification to the verification flow', () => {
    const target = resolveTargetFromData({ verification_request_id: 9, status: 'approved' });

    expect(resolveNotificationRouteIntent(target)).toEqual({ kind: 'verification' });
  });

  it('resolves nothing for a payload without a known identifier', () => {
    expect(resolveTargetFromData({ status: 'system' })).toEqual({
      targetType: null,
      targetId: null,
    });
    expect(resolveTargetFromData(null)).toEqual({ targetType: null, targetId: null });
  });

  it('accepts string identifiers, which is how push payloads arrive on Android', () => {
    const target = resolveTargetFromData({ support_ticket_id: '88' });

    expect(resolveNotificationRouteIntent(target)).toEqual({
      kind: 'supportTicket',
      ticketId: '88',
    });
  });
});
