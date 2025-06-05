import { supabase } from './supabaseClient';
import { GameState } from './types';

// Tạo phòng mới (có mật khẩu)
export async function createRoom(playerName: string, initialState: GameState, password: string) {
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    const { data, error } = await supabase
        .from('rooms')
        .insert([{ code, player1: playerName, state: initialState, password }]);
    if (error) throw error;
    return code;
}

// Tham gia phòng (kiểm tra mật khẩu)
export async function joinRoom(code: string, playerName: string, password: string) {
    // Lấy thông tin phòng để kiểm tra mật khẩu
    const { data: roomData, error: getError } = await supabase
        .from('rooms')
        .select('password, player2')
        .eq('code', code)
        .single();
    if (getError || !roomData) throw new Error('Không tìm thấy phòng!');
    if (roomData.player2) throw new Error('Phòng đã đủ người!');
    if (roomData.password !== password) throw new Error('Sai mật khẩu!');

    const { data, error } = await supabase
        .from('rooms')
        .update({ player2: playerName })
        .eq('code', code)
        .select();
    if (error) throw error;
    return data && data[0];
}

// Lấy trạng thái ván cờ hiện tại
export async function getRoomState(code: string) {
    const { data, error } = await supabase
        .from('rooms')
        .select('state')
        .eq('code', code)
        .single();
    if (error) throw error;
    return data.state;
}

// Cập nhật trạng thái ván cờ
export async function updateRoomState(code: string, newState: GameState) {
    const { error } = await supabase
        .from('rooms')
        .update({ state: newState })
        .eq('code', code);
    if (error) throw error;
}

// Lắng nghe realtime trạng thái ván cờ
export function subscribeRoomState(code: string, callback: (newState: GameState) => void) {
    return supabase
        .channel('room-updates')
        .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'rooms', filter: `code=eq.${code}` }, payload => {
            if (payload.new && payload.new.state) {
                callback(payload.new.state);
            }
        })
        .subscribe();
}
