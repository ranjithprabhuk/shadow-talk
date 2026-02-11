# ShadowTalk Implementation Plan

## Current Status

### Completed (Phases 1-5 basic)
- [x] Project setup (Vite + React + TypeScript + Tailwind)
- [x] Type system (user, message, peer, settings, protocol types)
- [x] Guest login with form validation
- [x] User store with localStorage persistence
- [x] Main layout (Header, Sidebar, ChatArea)
- [x] Dark/light theme toggle
- [x] UI primitives (Button, Input, Select, Modal, Avatar)
- [x] RTCManager - WebRTC peer connection management
- [x] SignalingService - Out-of-band offer/answer encoding (base64/QR)
- [x] useWebRTC hook (singleton pattern - fixed)
- [x] InviteModal - Create/join room with QR codes
- [x] ChatArea with group messaging
- [x] MessageList, MessageInput, Message components
- [x] Sidebar with online peers display
- [x] Zustand stores (user, chat, peer, settings)

### Bug Fix Applied
- **RTCManager singleton**: Fixed multiple-instance bug where InviteModal and ChatArea
  had separate RTCManager instances, causing messages to never be delivered.

---

## Remaining Implementation Phases

### Phase 6: Private Chat (Priority: High)
**Goal**: 1-to-1 messaging between peers via sidebar click

**Files to create/modify**:
- `src/components/private-chat/PrivateChatPanel.tsx` - Slide-in panel for private chat
- `src/components/layout/Sidebar.tsx` - Add click handler to open private chat
- `src/components/layout/MainLayout.tsx` - Manage private chat panel state

**Implementation**:
1. Click user in sidebar → open PrivateChatPanel (slide-in from right)
2. Reuse MessageList + MessageInput for private messages
3. Send messages with `to: peerId` instead of `to: 'all'`
4. Use `sendMessage(peerId, msg)` instead of `broadcastMessage(msg)`
5. Handle incoming private messages in ChatArea's message handler
6. Show unread badge on sidebar user cards

---

### Phase 7: Voice & Video Calls (Priority: Medium)
**Goal**: WebRTC audio/video streaming between peers

**Files to create**:
- `src/components/private-chat/VideoCall.tsx`
- `src/components/private-chat/CallControls.tsx`

**Implementation**:
1. Add call buttons (phone, video) to PrivateChatPanel header
2. Use `navigator.mediaDevices.getUserMedia()` for local stream
3. Use RTCManager's `addMediaStream()` / `removeMediaStream()`
4. Handle `onRemoteTrack` for incoming media
5. CallControls: mute, camera toggle, end call
6. Protocol messages: CALL_OFFER, CALL_ANSWER, CALL_REJECT, CALL_END

---

### Phase 8: File Sharing (Priority: Medium)
**Goal**: Send files via WebRTC data channels

**Files to create**:
- `src/services/file/FileTransferService.ts`
- `src/components/file-transfer/FileUpload.tsx`
- `src/components/file-transfer/FilePreview.tsx`
- `src/components/file-transfer/FileProgress.tsx`

**Implementation**:
1. FileTransferService: chunk files, send via data channel, reassemble
2. Protocol: FILE_OFFER → FILE_ACCEPT/REJECT → FILE_CHUNK → FILE_COMPLETE
3. File attachment button in MessageInput
4. Progress bar during transfer
5. Preview for images, download link for other types
6. Max 100MB per file, 64KB chunks

---

### Phase 9: Block User Feature (Priority: Medium)
**Goal**: Block/unblock users, hide their messages

**Files to modify**:
- `src/store/settingsStore.ts` - Already has blockedPeers
- `src/components/layout/Sidebar.tsx` - Context menu with block option
- `src/components/chat/MessageList.tsx` - Filter blocked messages

**Implementation**:
1. Right-click context menu on user card
2. Block/unblock toggles in settingsStore
3. Filter messages from blocked users (show "blocked message" placeholder)
4. Prevent private chat with blocked users
5. Persist blocked list in localStorage

---

### Phase 10: Settings Panel (Priority: Medium)
**Goal**: Full settings modal with all sections

**Files to create**:
- `src/components/settings/SettingsModal.tsx`
- `src/components/settings/ProfileSettings.tsx`
- `src/components/settings/AppearanceSettings.tsx`
- `src/components/settings/PrivacySettings.tsx`
- `src/components/settings/DataSettings.tsx`

**Implementation**:
1. Tabbed settings modal (Profile, Appearance, Privacy, Data)
2. Profile: edit name, gender, age
3. Appearance: theme, font size, chat density
4. Privacy: show/hide age/gender, blocked users list
5. Data: export chat history, clear history, reset defaults

---

### Phase 11: Notifications (Priority: Low)
**Goal**: Sound + browser notifications for new messages

**Files to create**:
- `src/services/notification/NotificationService.ts`

**Implementation**:
1. Browser Notification API for background alerts
2. Sound playback for new messages
3. Toast notifications (already using sonner)
4. Settings integration for enable/disable

---

### Phase 12: Polish (Priority: Low)
- Responsive design testing
- Mobile hamburger menu for sidebar
- Error handling improvements
- Connection retry logic
- Loading states
- Accessibility (ARIA, keyboard nav)
