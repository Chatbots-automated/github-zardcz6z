import { refreshAccessToken } from './googleAuth';

const CALENDAR_ID = '6b15306aca13f2f311f3994866b7492d616027788e6ad9ff2fac90fab57ecfd1@group.calendar.google.com';
const CALENDAR_API_BASE = 'https://www.googleapis.com/calendar/v3';

export const checkAvailability = async (accessToken: string, startTime: string, endTime: string): Promise<boolean> => {
  try {
    const params = new URLSearchParams({
      timeMin: startTime,
      timeMax: endTime,
      singleEvents: 'true',
      orderBy: 'startTime',
    });

    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events?${params}`;
    console.log('📅 Checking availability at URL:', url);

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Google Calendar API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        requestUrl: url,
      });
      throw new Error(`Google Calendar API Error: ${JSON.stringify(data)}`);
    }

    console.log('✅ API Response:', {
      items: data.items?.length || 0,
      timeMin: startTime,
      timeMax: endTime,
    });
    return data.items?.length === 0;
  } catch (error) {
    console.error('❌ Error checking availability:', {
      error,
      timeRange: { start: startTime, end: endTime },
    });
    return false;
  }
};

export const createBooking = async (
  accessToken: string,
  booking: {
    summary: string;
    description: string;
    start: string;
    end: string;
  }
): Promise<string> => {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events`;
    console.log('📝 Creating booking:', {
      summary: booking.summary,
      timeRange: { start: booking.start, end: booking.end },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: booking.summary,
        description: booking.description,
        start: {
          dateTime: booking.start,
          timeZone: 'Europe/Vilnius',
        },
        end: {
          dateTime: booking.end,
          timeZone: 'Europe/Vilnius',
        },
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('❌ Google Calendar API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: data,
        requestBody: booking,
        requestUrl: url,
      });
      throw new Error(`Google Calendar API Error: ${JSON.stringify(data)}`);
    }

    console.log('✅ Booking Created Successfully:', {
      eventId: data.id,
      summary: data.summary,
      start: data.start,
      end: data.end,
    });
    return data.id;
  } catch (error) {
    console.error('❌ Error creating booking:', {
      error,
      booking,
      calendarId: CALENDAR_ID,
    });
    throw error;
  }
};

export const cancelBooking = async (accessToken: string, eventId: string): Promise<void> => {
  try {
    const url = `${CALENDAR_API_BASE}/calendars/${encodeURIComponent(CALENDAR_ID)}/events/${eventId}`;
    console.log('🗑️ Canceling booking:', { eventId });
    
    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Google Calendar API Error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData,
        eventId,
        requestUrl: url,
      });
      throw new Error(`Failed to cancel booking: ${JSON.stringify(errorData)}`);
    }

    console.log('✅ Booking Cancelled Successfully:', { eventId });
  } catch (error) {
    console.error('❌ Error canceling booking:', {
      error,
      eventId,
      calendarId: CALENDAR_ID,
    });
    throw error;
  }
};