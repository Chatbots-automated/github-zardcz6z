import { db } from '../config/firebase';
import { collection, addDoc, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { Booking } from '../types/booking';
import * as googleCalendar from './googleCalendar';
import * as googleAuth from './googleAuth';

const getStoredTokens = () => {
  const accessToken = localStorage.getItem('googleAccessToken');
  const refreshToken = localStorage.getItem('googleRefreshToken');
  const tokenExpiry = localStorage.getItem('tokenExpiry');

  return {
    accessToken,
    refreshToken,
    tokenExpiry: tokenExpiry ? parseInt(tokenExpiry, 10) : null
  };
};

const ensureValidToken = async (): Promise<string> => {
  const { accessToken, refreshToken, tokenExpiry } = getStoredTokens();

  if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
    if (refreshToken) {
      const tokens = await googleAuth.refreshAccessToken(refreshToken);
      localStorage.setItem('googleAccessToken', tokens.access_token);
      localStorage.setItem('tokenExpiry', (Date.now() + (tokens.expires_in * 1000)).toString());
      return tokens.access_token;
    } else {
      // Redirect to auth flow
      window.location.href = googleAuth.getAuthUrl();
      throw new Error('Authentication required');
    }
  }
  return accessToken;
};

export const createBooking = async (bookingData: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>) => {
  try {
    const token = await ensureValidToken();
    const now = new Date().toISOString();
    const startTime = `${bookingData.date}T${bookingData.time}:00`;
    const endTime = new Date(new Date(startTime).getTime() + 15 * 60000).toISOString();

    // Check Google Calendar availability
    const isAvailable = await googleCalendar.checkAvailability(token, startTime, endTime);
    if (!isAvailable) {
      throw new Error('Time slot is not available');
    }

    // Create Google Calendar event
    const eventId = await googleCalendar.createBooking(token, {
      summary: `Tanning Session - ${bookingData.cabin}`,
      description: `Booking for ${bookingData.userEmail}`,
      start: startTime,
      end: endTime,
    });

    // Create Firestore booking
    const bookingRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      googleEventId: eventId,
      createdAt: now,
      updatedAt: now,
      status: 'confirmed',
    });

    return bookingRef.id;
  } catch (error) {
    console.error('Error creating booking:', error);
    throw error;
  }
};

export const getUserBookings = async (userId: string) => {
  try {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('userId', '==', userId)
    );
    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    throw error;
  }
};

export const cancelBooking = async (bookingId: string, googleEventId: string) => {
  try {
    const token = await ensureValidToken();
    
    // Cancel Google Calendar event
    await googleCalendar.cancelBooking(token, googleEventId);

    // Update Firestore booking
    const bookingRef = doc(db, 'bookings', bookingId);
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error canceling booking:', error);
    throw error;
  }
};