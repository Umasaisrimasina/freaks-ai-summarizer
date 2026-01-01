/**
 * Room Service
 * Manages study room metadata in Firestore
 * 
 * Stores room name, task, creator info so that
 * users joining by code see the correct room details
 * 
 * IMPORTANT: All room IDs are normalized to UPPERCASE for consistent matching
 */

import { db, auth } from '../firebase';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp, increment } from 'firebase/firestore';

export interface RoomMetadata {
    id: string;
    name: string;
    currentTask: string;
    participants: number;
    createdBy: string;
    createdAt: Date;
}

/**
 * Normalize room ID to uppercase for consistent matching
 */
function normalizeRoomId(roomId: string): string {
    return roomId.toUpperCase();
}

/**
 * Create a new room in Firestore
 * Called when User 1 creates a room
 */
export async function createRoom(roomId: string, roomName: string, currentTask: string = 'Study Session'): Promise<RoomMetadata> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
        throw new Error('Must be signed in to create a room');
    }

    // Normalize room ID to uppercase
    const normalizedId = normalizeRoomId(roomId);

    const roomData = {
        id: normalizedId,
        name: roomName,
        currentTask,
        participants: 1,
        createdBy: currentUser.uid,
        createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'studyRooms', normalizedId), roomData);

    return {
        id: normalizedId,
        name: roomName,
        currentTask,
        participants: 1,
        createdBy: currentUser.uid,
        createdAt: new Date(),
    };
}

/**
 * Get room metadata by room code/ID
 * Called when User 2 joins by code to get the actual room name
 */
export async function getRoomByCode(roomCode: string): Promise<RoomMetadata | null> {
    try {
        // Normalize room code to uppercase
        const normalizedCode = normalizeRoomId(roomCode);
        const roomDoc = await getDoc(doc(db, 'studyRooms', normalizedCode));
        
        if (!roomDoc.exists()) {
            return null;
        }

        const data = roomDoc.data();
        return {
            id: data.id,
            name: data.name,
            currentTask: data.currentTask,
            participants: data.participants,
            createdBy: data.createdBy,
            createdAt: data.createdAt?.toDate() || new Date(),
        };
    } catch (error) {
        console.error('[RoomService] Error fetching room:', error);
        return null;
    }
}

/**
 * Increment participant count when someone joins
 */
export async function joinRoom(roomId: string): Promise<void> {
    try {
        const normalizedId = normalizeRoomId(roomId);
        await updateDoc(doc(db, 'studyRooms', normalizedId), {
            participants: increment(1),
        });
    } catch (error) {
        console.warn('[RoomService] Could not update participant count:', error);
    }
}

/**
 * Decrement participant count when someone leaves
 */
export async function leaveRoom(roomId: string): Promise<void> {
    try {
        const normalizedId = normalizeRoomId(roomId);
        await updateDoc(doc(db, 'studyRooms', normalizedId), {
            participants: increment(-1),
        });
    } catch (error) {
        console.warn('[RoomService] Could not update participant count:', error);
    }
}
