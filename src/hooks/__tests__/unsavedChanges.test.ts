import { createLeaveHandler } from '../unsavedChanges';

function setup(dirty: boolean) {
  const confirmDiscard = jest.fn();
  const event = { preventDefault: jest.fn() };
  const leave = jest.fn();
  const handle = createLeaveHandler({ isDirty: () => dirty, confirmDiscard });

  return { confirmDiscard, event, leave, handle };
}

describe('createLeaveHandler', () => {
  it('lets a clean screen go without asking', () => {
    const { handle, event, leave, confirmDiscard } = setup(false);

    handle(event, leave);

    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(confirmDiscard).not.toHaveBeenCalled();
    expect(leave).not.toHaveBeenCalled();
  });

  it('stops the navigation and asks when there are unsaved edits', () => {
    const { handle, event, leave, confirmDiscard } = setup(true);

    handle(event, leave);

    expect(event.preventDefault).toHaveBeenCalledTimes(1);
    expect(confirmDiscard).toHaveBeenCalledTimes(1);
    expect(leave).not.toHaveBeenCalled();
  });

  it('leaves only after the user chooses to discard', () => {
    const { handle, event, leave, confirmDiscard } = setup(true);

    handle(event, leave);
    const discard = confirmDiscard.mock.calls[0]?.[0] as () => void;
    discard();

    expect(leave).toHaveBeenCalledTimes(1);
  });

  it('reads the dirty state at the moment of leaving', () => {
    let dirty = true;
    const confirmDiscard = jest.fn();
    const handle = createLeaveHandler({ isDirty: () => dirty, confirmDiscard });
    const event = { preventDefault: jest.fn() };

    dirty = false; // saved just before goBack()
    handle(event, jest.fn());

    expect(confirmDiscard).not.toHaveBeenCalled();
  });
});
