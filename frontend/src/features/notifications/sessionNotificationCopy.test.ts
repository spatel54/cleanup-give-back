import {
  formatSessionUpdateBody,
  formatSessionUpdateTitle,
  sessionPlaceFromFields,
  shortSessionPlaceName,
} from './sessionNotificationCopy';

describe('sessionNotificationCopy', () => {
  it('shortens a comma-separated address to the place name', () => {
    expect(shortSessionPlaceName('Lake Park, Des Plaines, IL')).toBe('Lake Park');
    expect(shortSessionPlaceName('  ')).toBeNull();
    expect(shortSessionPlaceName('Unknown')).toBeNull();
  });

  it('prefers description over activity', () => {
    expect(sessionPlaceFromFields('River Trail, IL', 'Park Cleanup')).toBe('River Trail');
    expect(sessionPlaceFromFields(null, 'Park Cleanup')).toBe('Park Cleanup');
  });

  it('adds the place to session titles and bodies once', () => {
    expect(formatSessionUpdateTitle('Session Approved!', 'Lake Park')).toBe(
      'Session Approved! · Lake Park',
    );
    expect(formatSessionUpdateTitle('Session Approved! · Lake Park', 'Lake Park')).toBe(
      'Session Approved! · Lake Park',
    );
    expect(
      formatSessionUpdateBody('Your volunteer session has been approved.', 'Lake Park'),
    ).toBe('Your volunteer session at Lake Park has been approved.');
    expect(
      formatSessionUpdateBody('Your session hours were updated to 2 hours.', 'Oakton Park'),
    ).toBe('Your session hours at Oakton Park were updated to 2 hours.');
    expect(
      formatSessionUpdateBody('Your volunteer session at Lake Park has been approved.', 'Lake Park'),
    ).toBe('Your volunteer session at Lake Park has been approved.');
  });
});
