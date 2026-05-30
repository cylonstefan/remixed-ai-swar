import React, { useState, useEffect } from 'react';
import { initializeApp, getApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInWithPopup, 
  GoogleAuthProvider, 
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { 
  Mail, Folder, Calendar, MessageSquare, FileSpreadsheet, Play, CheckCircle, 
  CheckSquare, Plus, Trash2, Send, RefreshCw, LogOut, Clock, ExternalLink, 
  Lock, Cloud, BookOpen, Key, Cpu, Sliders, AlertTriangle, AlertCircle, 
  ChevronRight, ArrowRight, UserCheck, ShieldCheck, Download, Upload, Edit2, Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import firebaseConfig from '../../firebase-applet-config.json';
import { cn } from '../lib/utils';

// Initialize Firebase App uniquely
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);

// Provider configuration
const provider = new GoogleAuthProvider();
// Required Scopes
const SCOPES = [
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.send',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/chat.messages',
  'https://www.googleapis.com/auth/chat.spaces',
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/presentations',
  'https://www.googleapis.com/auth/tasks'
];
SCOPES.forEach(scope => provider.addScope(scope));

type WorkspaceTab = 'gmail' | 'drive' | 'chat' | 'calendar' | 'sheets' | 'slides' | 'tasks';

export const GoogleWorkspaceHub = React.memo(({ showToast }: { showToast: (msg: string) => void }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [signingIn, setSigningIn] = useState<boolean>(false);
  const [activeSubTab, setActiveSubTab] = useState<WorkspaceTab>('gmail');

  // Generic data states
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [apiError, setApiError] = useState<string | null>(null);

  // GMAIL STATES
  const [emails, setEmails] = useState<any[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<any>(null);
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [isComposingEmail, setIsComposingEmail] = useState(false);

  // DRIVE STATES
  const [driveFiles, setDriveFiles] = useState<any[]>([]);
  const [newFileName, setNewFileName] = useState('');
  const [newFileContent, setNewFileContent] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  // CHAT STATES
  const [chatSpaces, setChatSpaces] = useState<any[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string>('');
  const [spaceMessages, setSpaceMessages] = useState<any[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');

  // CALENDAR STATES
  const [events, setEvents] = useState<any[]>([]);
  const [newEventSummary, setNewEventSummary] = useState('');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [newEventStart, setNewEventStart] = useState('');
  const [newEventEnd, setNewEventEnd] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // SHEETS STATES
  const [spreadsheets, setSpreadsheets] = useState<any[]>([]);
  const [selectedSheetId, setSelectedSheetId] = useState<string>('');
  const [sheetData, setSheetData] = useState<any>(null);
  const [editCellRow, setEditCellRow] = useState<number | null>(null);
  const [editCellCol, setEditCellCol] = useState<number | null>(null);
  const [editCellValue, setEditCellValue] = useState('');

  // SLIDES STATES
  const [presentations, setPresentations] = useState<any[]>([]);
  const [selectedPresentationId, setSelectedPresentationId] = useState<string>('');
  const [presentationMetadata, setPresentationMetadata] = useState<any>(null);
  const [newDeckTitle, setNewDeckTitle] = useState('');

  // TASKS STATES
  const [taskLists, setTaskLists] = useState<any[]>([]);
  const [selectedTaskListId, setSelectedTaskListId] = useState<string>('');
  const [tasks, setTasks] = useState<any[]>([]);
  const [newListName, setNewListName] = useState('');
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskNotes, setNewTaskNotes] = useState('');
  const [newTaskDue, setNewTaskDue] = useState('');

  // Firebase Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Attempt to fetch credentials from local cache if signed in during this run
        // If not, we will need to re-auth
      } else {
        setUser(null);
        setToken(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Fetch token or login
  const handleGoogleSignIn = async () => {
    setSigningIn(true);
    setApiError(null);
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        setToken(credential.accessToken);
        setUser(result.user);
        showToast('Pomyślnie zautoryzowano dostęp Google Workspace!');
      } else {
        throw new Error('Nie udało się uzyskać tokenu dostępowego Google.');
      }
    } catch (e: any) {
      console.error(e);
      setApiError(e.message || 'Wystąpił błąd podczas autoryzacji OAuth.');
      showToast('Autoryzacja nie powiodła się.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      setToken(null);
      setUser(null);
      showToast('Wylogowano z konta Google.');
    } catch (e: any) {
      console.error(e);
    }
  };

  // Safe wrapper for fetches incorporating Token Validation
  const apiFetch = async (url: string, options: RequestInit = {}) => {
    if (!token) {
      throw new Error('Uwierzytelnienie wygasło. Proszę zalogować się ponownie.');
    }
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
    const response = await fetch(url, { ...options, headers });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody?.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  };

  // LOAD DATA TRIGGERS ON SUBTAB CHANGE
  useEffect(() => {
    if (!token) return;
    setApiError(null);
    try {
      switch (activeSubTab) {
        case 'gmail':
          loadGmailMessages();
          break;
        case 'drive':
          loadDriveFiles();
          break;
        case 'chat':
          loadChatSpaces();
          break;
        case 'calendar':
          loadCalendarEvents();
          break;
        case 'sheets':
          loadSpreadsheets();
          break;
        case 'slides':
          loadPresentations();
          break;
        case 'tasks':
          loadTaskLists();
          break;
      }
    } catch (e: any) {
      setApiError(e.message);
    }
  }, [activeSubTab, token]);

  // ==========================================
  // GMAIL MANAGEMENT
  // ==========================================
  const loadGmailMessages = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=10');
      if (data.messages && data.messages.length > 0) {
        const fullMessages = await Promise.all(
          data.messages.map(async (msg: any) => {
            return await apiFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=Date`);
          })
        );
        setEmails(fullMessages);
      } else {
        setEmails([]);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadEmailDetails = async (id: string) => {
    try {
      const fullMsg = await apiFetch(`https://gmail.googleapis.com/gmail/v1/users/me/messages/${id}?format=full`);
      setSelectedEmail(fullMsg);
    } catch (e: any) {
      showToast(`Błąd odczytu e-maila: ${e.message}`);
    }
  };

  const handleSendEmail = async () => {
    if (!emailTo || !emailSubject || !emailBody) {
      showToast('Wypełnij wszystkie pola wiadomości!');
      return;
    }

    // MANDATORY USER CONFIRMATION FOR SENSITIVE ACTIONS
    const confirmed = window.confirm(
      `CZY CHCESZ WYSŁAĆ E-MAIL? \nOdbiorca: ${emailTo}\nTemat: ${emailSubject}\nPotwierdź wysłanie za pośrednictwem zarejestrowanego konta.`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Craft clean Base64Url RFC822 Email Body
      const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(emailSubject)))}?=`;
      const emailContent = [
        `To: ${emailTo}`,
        `Subject: ${utf8Subject}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        '',
        emailBody.replace(/\n/g, '<br />')
      ].join('\n');

      const encodedEmail = btoa(unescape(encodeURIComponent(emailContent)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

      await apiFetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
        method: 'POST',
        body: JSON.stringify({ raw: encodedEmail })
      });

      showToast('E-mail został pomyślnie wysłany!');
      setEmailTo('');
      setEmailSubject('');
      setEmailBody('');
      setIsComposingEmail(false);
      loadGmailMessages();
    } catch (e: any) {
      showToast(`Błąd wysyłania e-maila: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // DRIVE MANAGEMENT
  // ==========================================
  const loadDriveFiles = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://www.googleapis.com/drive/v3/files?pageSize=20&fields=files(id,name,mimeType,size,createdTime,webViewLink)');
      setDriveFiles(data.files || []);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateFileOnDrive = async () => {
    if (!newFileName) {
      showToast('Podaj nazwę pliku!');
      return;
    }

    const confirmed = window.confirm(`CZY CHCESZ UTWORZYĆ PLIK NA DYSKU GOOGLE?\nNazwa pliku: ${newFileName}\nZapisze plik tekstowy na Twoim dysku Chmurowym.`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Create metadata first
      const metadata = {
        name: newFileName,
        mimeType: 'text/plain'
      };

      const fileObj = await apiFetch('https://www.googleapis.com/drive/v3/files', {
        method: 'POST',
        body: JSON.stringify(metadata)
      });

      // Upload text content via simple update
      await fetch(`https://www.googleapis.com/upload/drive/v3/files/${fileObj.id}?uploadType=media`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'text/plain'
        },
        body: newFileContent || 'Pusta zawartość wygenerowana przez AI Swarm OS.'
      });

      showToast('Plik został utworzony i przesłany do Google Drive!');
      setNewFileName('');
      setNewFileContent('');
      setIsUploadingFile(false);
      loadDriveFiles();
    } catch (e: any) {
      showToast(`Błąd zapisu pliku: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteDriveFile = async (id: string, name: string) => {
    const confirmed = window.confirm(`[NIEODWRACALNE] CZY USUNĄĆ PLIK Z DYSKU GOOGLE?\nPlik: "${name}" zostanie trwale skasowany!`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch(`https://www.googleapis.com/drive/v3/files/${id}`, {
        method: 'DELETE'
      });
      showToast('Plik został usunięty z Dysku Google.');
      loadDriveFiles();
    } catch (e: any) {
      showToast(`Błąd usuwania pliku: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // CHAT MANAGEMENT
  // ==========================================
  const loadChatSpaces = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://chat.googleapis.com/v1/spaces');
      setChatSpaces(data.spaces || []);
      if (data.spaces && data.spaces.length > 0) {
        setSelectedSpaceId(data.spaces[0].name);
        loadSpaceMessages(data.spaces[0].name);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadSpaceMessages = async (spaceId: string) => {
    setActionLoading(true);
    try {
      const data = await apiFetch(`https://chat.googleapis.com/v1/${spaceId}/messages?pageSize=15`);
      setSpaceMessages(data.messages || []);
    } catch (e: any) {
      showToast(`Błąd ładowania wiadomości Chat: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSendChatMessage = async () => {
    if (!newChatMessage || !selectedSpaceId) {
      showToast('Wpisz treść wiadomości!');
      return;
    }

    const confirmed = window.confirm(`POTWIERDŹ WYSŁANIE SYGNAŁU NA CZAT:\nPokój: ${selectedSpaceId}\nTreść: "${newChatMessage}"`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch(`https://chat.googleapis.com/v1/${selectedSpaceId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ text: newChatMessage })
      });
      showToast('Wiadomość została wysłana na Google Chat!');
      setNewChatMessage('');
      loadSpaceMessages(selectedSpaceId);
    } catch (e: any) {
      showToast(`Błąd wysyłania na Chat: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // CALENDAR MANAGEMENT
  // ==========================================
  const loadCalendarEvents = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?orderBy=startTime&singleEvents=true&maxResults=15');
      setEvents(data.items || []);
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateEvent = async () => {
    if (!newEventSummary || !newEventStart || !newEventEnd) {
      showToast('Wypełnij pola nazwy i ram czasowych wydarzenia!');
      return;
    }

    const confirmed = window.confirm(
      `POTWIERDŹ DODANIE WYDARZENIA DO TERMINARZA:\nNazwa: ${newEventSummary}\nStart: ${newEventStart}\nKoniec: ${newEventEnd}`
    );
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        method: 'POST',
        body: JSON.stringify({
          summary: newEventSummary,
          description: newEventDescription || 'Wydarzenie orkiestrowane automatycznie przez AI Swarm OS',
          start: { dateTime: new Date(newEventStart).toISOString() },
          end: { dateTime: new Date(newEventEnd).toISOString() }
        })
      });

      showToast('Wydarzenie pomyślnie dodane do Kalendarza Google!');
      setNewEventSummary('');
      setNewEventDescription('');
      setNewEventStart('');
      setNewEventEnd('');
      setIsCreatingEvent(false);
      loadCalendarEvents();
    } catch (e: any) {
      showToast(`Błąd tworzenia terminu: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEvent = async (id: string, summary: string) => {
    const confirmed = window.confirm(`POTWIERDŹ USUNIĘCIE TERMINU KALENDARZA:\nZostanie skasowane: "${summary}"`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events/${id}`, {
        method: 'DELETE'
      });
      showToast('Wydarzenie skasowano.');
      loadCalendarEvents();
    } catch (e: any) {
      showToast(`Błąd kasowania kalendarza: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // SHEETS MANAGEMENT
  // ==========================================
  const loadSpreadsheets = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.spreadsheet\'&pageSize=15');
      setSpreadsheets(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelectedSheetId(data.files[0].id);
        loadSpreadsheetCells(data.files[0].id);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadSpreadsheetCells = async (id: string) => {
    setActionLoading(true);
    try {
      // First get spreadsheet metadata to find sheets count / names
      const meta = await apiFetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}`);
      const firstSheetTitle = meta.sheets?.[0]?.properties?.title || 'Sheet1';
      // Fetch dynamic range values (say first 50 rows, 10 columns)
      const values = await apiFetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${firstSheetTitle}!A1:J50`);
      setSheetData({
        title: meta.properties?.title,
        sheetName: firstSheetTitle,
        rows: values.values || []
      });
    } catch (e: any) {
      showToast(`Błąd odczytu arkusza: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSheetCell = async () => {
    if (editCellRow === null || editCellCol === null || !selectedSheetId || !sheetData) return;

    const confirmed = window.confirm(`POTWIERDŹ ZMIANĘ WARTOŚCI KOMÓRKI:\nNowa wartość: "${editCellValue}"`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      // Coordinate converting to Excel A1 notation
      const colLetter = String.fromCharCode(65 + editCellCol); // 0 -> A, 1 -> B...
      const rowNum = editCellRow + 1;
      const cellAddress = `${sheetData.sheetName}!${colLetter}${rowNum}`;

      await apiFetch(`https://sheets.googleapis.com/v4/spreadsheets/${selectedSheetId}/values/${cellAddress}?valueInputOption=USER_ENTERED`, {
        method: 'PUT',
        body: JSON.stringify({
          range: cellAddress,
          majorDimension: 'ROWS',
          values: [[editCellValue]]
        })
      });

      showToast('Wartość komórki uaktualniona w chmurze!');
      setEditCellRow(null);
      setEditCellCol(null);
      loadSpreadsheetCells(selectedSheetId);
    } catch (e: any) {
      showToast(`Błąd aktualizacji arkusza: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // SLIDES MANAGEMENT
  // ==========================================
  const loadPresentations = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://www.googleapis.com/drive/v3/files?q=mimeType=\'application/vnd.google-apps.presentation\'&pageSize=10');
      setPresentations(data.files || []);
      if (data.files && data.files.length > 0) {
        setSelectedPresentationId(data.files[0].id);
        loadPresentationMetadata(data.files[0].id);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadPresentationMetadata = async (id: string) => {
    setActionLoading(true);
    try {
      const data = await apiFetch(`https://slides.googleapis.com/v4/presentations/${id}`);
      setPresentationMetadata(data);
    } catch (e: any) {
      showToast(`Błąd odczytu prezentacji: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreatePresentation = async () => {
    if (!newDeckTitle) {
      showToast('Podaj tytuł nowej prezentacji!');
      return;
    }

    const confirmed = window.confirm(`POTWIERDŹ UTWORZENIE PREZENTACJI:\nTytuł: "${newDeckTitle}"`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      const file = await apiFetch('https://slides.googleapis.com/v4/presentations', {
        method: 'POST',
        body: JSON.stringify({ title: newDeckTitle })
      });

      showToast('Prezentacja została pomyślnie utworzona na Google Drive!');
      setNewDeckTitle('');
      loadPresentations();
    } catch (e: any) {
      showToast(`Błąd tworzenia decku: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // ==========================================
  // TASKS MANAGEMENT
  // ==========================================
  const loadTaskLists = async () => {
    setActionLoading(true);
    setApiError(null);
    try {
      const data = await apiFetch('https://tasks.googleapis.com/v1/users/@me/lists');
      setTaskLists(data.items || []);
      if (data.items && data.items.length > 0) {
        setSelectedTaskListId(data.items[0].id);
        loadTasksFromList(data.items[0].id);
      }
    } catch (e: any) {
      setApiError(e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const loadTasksFromList = async (listId: string) => {
    setActionLoading(true);
    try {
      const data = await apiFetch(`https://tasks.googleapis.com/v1/lists/${listId}/tasks?showCompleted=true&showHidden=true`);
      setTasks(data.items || []);
    } catch (e: any) {
      showToast(`Błąd ładowania listy zadań: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string, currentStatus: string, title: string) => {
    const nextStatus = currentStatus === 'completed' ? 'needsAction' : 'completed';
    const confirmed = window.confirm(`ZMIANA STATUSU ZADANIA:\nZadanie: "${title}" zostanie oznaczone jako ${nextStatus === 'completed' ? 'UKOŃCZONE' : 'NIEUKOŃCZONE'}.`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch(`https://tasks.googleapis.com/v1/lists/${selectedTaskListId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          id: taskId,
          title,
          status: nextStatus
        })
      });
      showToast('Status zadania zmieniony!');
      loadTasksFromList(selectedTaskListId);
    } catch (e: any) {
      showToast(`Błąd synchronizacji zadania: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddTask = async () => {
    if (!newTaskTitle) {
      showToast('Wpisz tytuł nowego zadania!');
      return;
    }

    const confirmed = window.confirm(`CZY CHCESZ DODAĆ NOWE ZADANIE DO LISTY W CHMURZE?\nZadanie: ${newTaskTitle}`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch(`https://tasks.googleapis.com/v1/lists/${selectedTaskListId}/tasks`, {
        method: 'POST',
        body: JSON.stringify({
          title: newTaskTitle,
          notes: newTaskNotes,
          due: newTaskDue ? new Date(newTaskDue).toISOString() : undefined
        })
      });

      showToast('Zadanie dodane do Google Tasks!');
      setNewTaskTitle('');
      setNewTaskNotes('');
      setNewTaskDue('');
      loadTasksFromList(selectedTaskListId);
    } catch (e: any) {
      showToast(`Błąd tworzenia zadania: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCreateTaskList = async () => {
    if (!newListName) {
      showToast('Podaj nazwę nowej listy!');
      return;
    }

    const confirmed = window.confirm(`CZY UTWORZYĆ NOWĄ GRUPĘ LISTY GOOGLE TASKS?\nNazwa: "${newListName}"`);
    if (!confirmed) return;

    setActionLoading(true);
    try {
      await apiFetch('https://tasks.googleapis.com/v1/users/@me/lists', {
        method: 'POST',
        body: JSON.stringify({ title: newListName })
      });
      showToast('Grupa zadań pomyślnie utworzona!');
      setNewListName('');
      loadTaskLists();
    } catch (e: any) {
      showToast(`Błąd nowej listy: ${e.message}`);
    } finally {
      setActionLoading(false);
    }
  };


  // ==========================================
  // VIEW RENDER LOGIC
  // ==========================================
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <RefreshCw className="animate-spin text-acid-purple" size={32} />
        <span className="text-xs font-mono tracking-widest text-slate-500 uppercase">Łączenie ze strukturami Cloud...</span>
      </div>
    );
  }

  if (!user || !token) {
    return (
      <div className="glass-panel border border-acid-purple/30 p-8 rounded-3xl max-w-2xl mx-auto space-y-6 relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 left-0 w-full h-[3px] bg-gradient-to-r from-transparent via-acid-purple/50 to-transparent" />
        <div className="absolute -top-12 -right-12 w-32 h-32 bg-acid-purple/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex items-center gap-4 border-b border-white/5 pb-4">
          <div className="p-3.5 bg-acid-purple/20 border border-acid-purple text-acid-purple rounded-2xl">
            <Cloud size={24} className="animate-pulse" />
          </div>
          <div>
            <h2 className="font-display font-black text-lg text-white uppercase tracking-wider">CHMURA GOOGLE WORKSPACE</h2>
            <p className="text-[10px] text-slate-500 font-mono">AUTORYZOWANA INTEGRACJA CLOUD • SEC_LEVEL: CERTIFIED</p>
          </div>
        </div>

        <div className="space-y-4 text-xs leading-relaxed text-slate-400 font-mono">
          <p>
            System <span className="text-white">AI Swarm OS</span> wymaga autoryzacji sesji, aby powiązać centralny orkiestrator sieci z wiodącymi usługami narzędziowymi Google Cloud.
          </p>
          <p className="p-4 bg-black/40 border border-white/5 rounded-xl text-slate-500 text-[10px] leading-relaxed">
            <span className="text-amber-500 font-bold uppercase block mb-1">Dostępne uprawnienia (Granular OAuth):</span>
            • Gmail (Skaner wiadomości, poczta wychodząca, odpowiedzi)<br />
            • Google Drive (Zarządzanie plikami sesji, pobieranie, generatory)<br />
            • Google Chat (Dedykowana komunikacja klastrowa, kanały dyskusyjne)<br />
            • Google Calendar (Sygnały telemetryczne czasu rzeczywistego, harmonogramy)<br />
            • Google Sheets & Slides (Analiza arkuszy kalkulacyjnych, render deku)<br />
            • Google Tasks (Trwała lista priorytetów operacyjnych klastra)
          </p>
        </div>

        {apiError && (
          <div className="p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-[10px] text-red-400 font-mono flex items-center gap-2">
            <AlertCircle size={14} className="shrink-0" />
            <span>{apiError}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row justify-between items-center pt-2 gap-4">
          <div className="text-[9px] text-slate-600 uppercase font-bold flex items-center gap-1.5 font-mono">
            <Lock size={10} className="text-emerald-500" /> SZYFROWANIE END-TO-END ACTIVE
          </div>

          <button
            onClick={handleGoogleSignIn}
            disabled={signingIn}
            className="gsi-material-button font-mono cursor-pointer transition-all hover:scale-[1.02] active:scale-95 border border-white/10 rounded-xl py-0.5 px-1 bg-neutral-950 hover:bg-neutral-900 flex items-center"
          >
            <div className="gsi-material-button-state"></div>
            <div className="gsi-material-button-content-wrapper flex items-center gap-3">
              <div className="gsi-material-button-icon bg-white p-2 rounded-lg">
                <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block', width: '18px', height: '18px' }}>
                  <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                  <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                  <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                  <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                </svg>
              </div>
              <span className="gsi-material-button-contents text-white text-xs font-bold font-display uppercase tracking-wider pr-4">
                {signingIn ? 'Łączenie...' : 'Połącz z kontem Google'}
              </span>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-mono text-sm">
      {/* Account Control Center Panel */}
      <div className="glass-panel border border-acid-purple/30 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-black/60">
        <div className="flex items-center gap-3">
          <div className="relative">
            {user.photoURL ? (
              <img src={user.photoURL} alt="Avatar" className="w-10 h-10 rounded-full border border-acid-purple/40" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-acid-purple/20 border border-acid-purple text-white flex items-center justify-center font-bold">
                {user.displayName?.[0] || 'U'}
              </div>
            )}
            <div className="absolute -bottom-1 -right-1 bg-emerald-500 rounded-full p-0.5 border border-black" title="Zalogowano przez OAuth">
              <ShieldCheck size={10} className="text-black" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-black uppercase text-white tracking-widest">{user.displayName}</span>
              <span className="text-[8px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1.5 py-0.5 rounded-full font-black uppercase tracking-wider">ACTIVE CONN_METRIC</span>
            </div>
            <p className="text-[10px] text-slate-500 leading-tight">{user.email}</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          <div className="text-right hidden md:block">
            <div className="text-[9px] text-slate-500 uppercase font-black">Serwer Autoryzacji:</div>
            <div className="text-[10px] text-zinc-300 font-bold">google-auth.orchesty.mcp</div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center justify-center gap-1.5 px-3 py-1.5 border border-red-500/30 text-red-400 bg-red-950/10 hover:bg-red-950/30 hover:border-red-500 rounded-xl text-xs active:scale-95 transition-all w-full sm:w-auto"
          >
            <LogOut size={12} /> Odłącz Chmurę
          </button>
        </div>
      </div>

      {/* Main SubTab Directory Menu (grid of icons) */}
      <div className="grid grid-cols-3 md:grid-cols-7 gap-2.5">
        {(['gmail', 'drive', 'chat', 'calendar', 'sheets', 'slides', 'tasks'] as WorkspaceTab[]).map((t) => {
          const isActive = activeSubTab === t;
          let icon = <Mail size={16} />;
          let label = 'Gmail';
          let colorTheme = 'text-red-400 border-red-500/20 bg-red-950/5';
          let activeStyles = 'border-red-500/80 bg-red-950/35 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.1)]';

          if (t === 'drive') {
            icon = <Folder size={16} />;
            label = 'Drive';
            colorTheme = 'text-amber-500 border-amber-500/20 bg-amber-950/5';
            activeStyles = 'border-amber-500 bg-amber-950/35 text-amber-300 shadow-[0_0_12px_rgba(245,158,11,0.1)]';
          } else if (t === 'chat') {
            icon = <MessageSquare size={16} />;
            label = 'Chat';
            colorTheme = 'text-sky-400 border-sky-500/20 bg-sky-950/5';
            activeStyles = 'border-sky-500 bg-sky-950/35 text-sky-300 shadow-[0_0_12px_rgba(56,189,248,0.1)]';
          } else if (t === 'calendar') {
            icon = <Calendar size={16} />;
            label = 'Calendar';
            colorTheme = 'text-emerald-400 border-emerald-500/20 bg-emerald-950/5';
            activeStyles = 'border-emerald-500 bg-emerald-950/35 text-emerald-300 shadow-[0_0_12px_rgba(52,211,153,0.1)]';
          } else if (t === 'sheets') {
            icon = <FileSpreadsheet size={16} />;
            label = 'Sheets';
            colorTheme = 'text-teal-400 border-teal-500/20 bg-teal-950/5';
            activeStyles = 'border-teal-500 bg-teal-950/35 text-teal-300 shadow-[0_0_12px_rgba(45,212,191,0.1)]';
          } else if (t === 'slides') {
            icon = <Play size={16} />;
            label = 'Slides';
            colorTheme = 'text-indigo-400 border-indigo-500/20 bg-indigo-950/5';
            activeStyles = 'border-indigo-500 bg-indigo-950/35 text-indigo-300 shadow-[0_0_12px_rgba(129,140,248,0.1)]';
          } else if (t === 'tasks') {
            icon = <CheckSquare size={16} />;
            label = 'Tasks';
            colorTheme = 'text-pink-400 border-pink-500/20 bg-pink-950/5';
            activeStyles = 'border-pink-500 bg-pink-950/35 text-pink-300 shadow-[0_0_12px_rgba(244,114,182,0.1)]';
          }

          return (
            <button
              key={t}
              onClick={() => setActiveSubTab(t)}
              className={cn(
                "p-3 rounded-xl border flex flex-col items-center justify-center text-center gap-1.5 transition-all text-[11px] font-black uppercase tracking-wider pointer-events-auto active:scale-95",
                colorTheme,
                isActive ? activeStyles : "hover:bg-white/[0.04] hover:border-white/10"
              )}
            >
              {icon}
              {label}
            </button>
          );
        })}
      </div>

      {/* Main Panel Content Area */}
      <div className="glass-panel border border-white/15 p-6 rounded-3xl min-h-[400px] relative">
        {actionLoading && (
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs flex flex-col items-center justify-center rounded-3xl z-30 space-y-2">
            <RefreshCw className="animate-spin text-acid-purple" size={32} />
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Wysyłanie zapytania do serwerów Google...</span>
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* apiError container */}
          {apiError && (
            <div className="mb-4 p-3 bg-red-950/20 border border-red-500/30 rounded-xl text-[10px] text-red-300 flex items-center gap-2">
              <AlertTriangle size={14} className="shrink-0" />
              <span>Błąd pobierania danych: {apiError}. Upewnij się, że zaakceptowałeś odpowiednie zgody lub odśwież połączenie.</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* GMAIL SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'gmail' && (
            <motion.div key="gmail" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <Mail className="text-red-400 animate-pulse" size={16} /> POCZTA GMAIL [INTELLIGENCE_BOX]
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsComposingEmail(!isComposingEmail)} className="px-3 py-1.5 bg-red-500 hover:bg-red-400 text-black font-black uppercase rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all">
                    <Plus size={12} /> Nowa Wiadomość
                  </button>
                  <button onClick={loadGmailMessages} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież pocztę">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {isComposingEmail && (
                <div className="p-4 border border-red-500/30 bg-red-950/10 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-red-300 uppercase tracking-widest border-b border-red-500/10 pb-1">Komponowanie Wiadomości</div>
                  <div className="space-y-2">
                    <input type="email" placeholder="Odbiorca (E-mail)" value={emailTo} onChange={(e) => setEmailTo(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-red-500" />
                    <input type="text" placeholder="Temat Wiadomości" value={emailSubject} onChange={(e) => setEmailSubject(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-red-500" />
                    <textarea placeholder="Treść e-maila..." rows={5} value={emailBody} onChange={(e) => setEmailBody(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs font-mono text-white focus:border-red-500" />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button onClick={() => setIsComposingEmail(false)} className="px-3 py-1.5 border border-white/15 text-slate-400 rounded hover:bg-white/5 uppercase font-medium">Anuluj</button>
                    <button onClick={handleSendEmail} className="px-4 py-1.5 bg-red-500 hover:bg-red-400 text-black font-black uppercase rounded-lg flex items-center gap-1.5 active:scale-95">
                      <Send size={12} /> Wyślij Pocztem
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                {/* Inbox Mail List */}
                <div className="lg:col-span-5 border border-white/5 bg-black/20 rounded-2xl divide-y divide-white/5 overflow-hidden">
                  <div className="p-2.5 bg-neutral-900/50 text-[10px] text-slate-500 font-bold uppercase tracking-wider">Ostatnio odebrane (Skrzynka)</div>
                  {emails.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-500 font-mono">Brak wiadomości w skrzynce zabezpieczeń.</div>
                  ) : (
                    emails.map((msg: any) => {
                      const fromHeader = msg.payload?.headers?.find((h: any) => h.name === 'From')?.value || 'Nieznany nadawca';
                      const subjectHeader = msg.payload?.headers?.find((h: any) => h.name === 'Subject')?.value || '(Bez tematu)';
                      const dateHeader = msg.payload?.headers?.find((h: any) => h.name === 'Date')?.value || '';

                      return (
                        <div
                          key={msg.id}
                          onClick={() => loadEmailDetails(msg.id)}
                          className={cn(
                            "p-3 cursor-pointer hover:bg-red-500/5 transition-all text-left",
                            selectedEmail?.id === msg.id ? "bg-red-950/15 border-l-2 border-red-500" : ""
                          )}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-[10px] text-white font-black truncate max-w-[150px]">{fromHeader}</span>
                            <span className="text-[9px] text-slate-500 font-mono">{new Date(dateHeader).toLocaleDateString()}</span>
                          </div>
                          <div className="text-xs font-bold text-zinc-300 truncate mt-0.5">{subjectHeader}</div>
                          <p className="text-[10px] text-slate-500 truncate mt-1">{msg.snippet}</p>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Email Viewer Detailed Panel */}
                <div className="lg:col-span-7 border border-white/5 bg-black/40 rounded-2xl p-4 flex flex-col justify-between min-h-[300px]">
                  {selectedEmail ? (
                    <div className="space-y-4 text-left">
                      <div className="border-b border-white/5 pb-3">
                        <div className="flex justify-between items-center text-[10px] text-slate-500">
                          <span>OD: <span className="text-red-400 font-bold">{selectedEmail.payload?.headers?.find((h: any) => h.name === 'From')?.value}</span></span>
                          <span>{new Date(selectedEmail.payload?.headers?.find((h: any) => h.name === 'Date')?.value).toLocaleString()}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white mt-1 uppercase font-display tracking-tight">
                          {selectedEmail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value}
                        </h3>
                      </div>
                      <div className="text-xs text-slate-300 leading-relaxed font-mono whitespace-pre-wrap select-all max-h-[320px] overflow-auto border-dashed border-white/5 p-2 bg-neutral-950/40 rounded-lg">
                        {/* Body retrieval */}
                        {selectedEmail.snippet || "Dokonano zaimportowania szczegółowego tekstu do terminala."}
                        <div className="border-t border-white/5 pt-2.5 mt-4 text-[10px] text-slate-600 block">
                          ZID: {selectedEmail.id} | Wykorzystaj do analiz i raportowania.
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-2 text-slate-500">
                      <Mail size={32} className="opacity-20 text-red-500" />
                      <p className="text-xs uppercase font-bold text-slate-600">SEKTOR POCZTY - CZEKA NA SYGNAŁ</p>
                      <p className="text-[10px]">Wybierz z listy po lewej, aby odczytać zawartość e-maila.</p>
                    </div>
                  )}

                  {selectedEmail && (
                    <div className="border-t border-white/5 pt-3 mt-4 flex justify-end">
                      <button
                        onClick={() => {
                          const fromVal = selectedEmail.payload?.headers?.find((h: any) => h.name === 'From')?.value || '';
                          const emailMatch = fromVal.match(/<(.+?)>/) || [null, fromVal];
                          const replyToEmail = emailMatch[1] || fromVal;
                          setEmailTo(replyToEmail);
                          setEmailSubject(`Re: ${selectedEmail.payload?.headers?.find((h: any) => h.name === 'Subject')?.value}`);
                          setIsComposingEmail(true);
                          setSelectedEmail(null);
                        }}
                        className="px-3 py-1 bg-red-950/20 text-red-400 border border-red-500/30 hover:bg-red-500/10 rounded uppercase text-[10px] font-bold"
                      >
                        Odpowiedz Nadawcy
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* DRIVE SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'drive' && (
            <motion.div key="drive" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <Folder className="text-amber-500 animate-pulse" size={16} /> REPOZYTORIUM GOOGLE DRIVE [NODE_FILES]
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsUploadingFile(!isUploadingFile)} className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all">
                    <Plus size={12} /> Utwórz Nowy Plik
                  </button>
                  <button onClick={loadDriveFiles} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież dysk">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {isUploadingFile && (
                <div className="p-4 border border-amber-500/30 bg-amber-950/10 rounded-2xl space-y-3">
                  <div className="text-xs font-bold text-amber-300 uppercase tracking-widest border-b border-amber-500/10 pb-1">Zapis wirtualnego pliku do Chmury</div>
                  <div className="space-y-2">
                    <input type="text" placeholder="Nazwa pliku (np. raport_wydajnosci.txt)" value={newFileName} onChange={(e) => setNewFileName(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-amber-500" />
                    <textarea placeholder="Wpisz treść pliku tekstowego..." rows={4} value={newFileContent} onChange={(e) => setNewFileContent(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg p-3 text-xs font-mono text-white focus:border-amber-500" />
                  </div>
                  <div className="flex justify-end gap-2 text-xs">
                    <button onClick={() => setIsUploadingFile(false)} className="px-3 py-1.5 border border-white/15 text-slate-400 rounded hover:bg-white/5 uppercase font-medium">Anuluj</button>
                    <button onClick={handleCreateFileOnDrive} className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-black uppercase rounded-lg flex items-center gap-1.5 active:scale-95">
                      <Upload size={12} /> Zapisz na Dysku
                    </button>
                  </div>
                </div>
              )}

              {/* Grid Layout files */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {driveFiles.length === 0 ? (
                  <div className="col-span-full p-12 text-center text-xs text-slate-500 font-mono uppercase bg-neutral-950/40 rounded-2xl">Brak rozpoznanych plików powiązanych z aplikacją.</div>
                ) : (
                  driveFiles.map((file) => {
                    const sizeMB = file.size ? `${(Number(file.size) / 1024 / 1024).toFixed(2)} MB` : 'Brak danych';
                    return (
                      <div key={file.id} className="glass-panel border border-white/5 bg-black/20 p-4 rounded-xl flex flex-col justify-between hover:border-amber-500/40 transition-all text-left">
                        <div>
                          <div className="flex items-start gap-2">
                            <div className="p-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-lg">
                              <Folder size={18} />
                            </div>
                            <div className="truncate w-full">
                              <h4 className="font-bold text-white text-xs truncate uppercase font-display py-0.5" title={file.name}>{file.name}</h4>
                              <p className="text-[9px] text-slate-500 truncate">{file.mimeType}</p>
                            </div>
                          </div>
                          <div className="mt-3 space-y-1 text-[10px] font-mono text-slate-400 border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>ROZMIAR:</span>
                              <span className="text-white font-bold">{sizeMB}</span>
                            </div>
                            <div className="flex justify-between">
                              <span>PULPIT CLOUD:</span>
                              <span className="text-amber-500 font-bold uppercase truncate max-w-[120px]">{file.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center mt-4 pt-2.5 border-t border-white/5">
                          <button
                            onClick={() => handleDeleteDriveFile(file.id, file.name)}
                            className="p-1 px-2 border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-500 rounded hover:border-red-500 text-[9px] font-black uppercase flex items-center gap-1 active:scale-95"
                          >
                            <Trash2 size={10} /> Usuń
                          </button>
                          {file.webViewLink && (
                            <a
                              href={file.webViewLink}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 px-2.5 bg-neutral-950 border border-white/10 hover:bg-neutral-900 text-white rounded text-[9px] font-bold uppercase flex items-center gap-1"
                            >
                              Podgląd <ExternalLink size={9} />
                            </a>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* CHAT SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'chat' && (
            <motion.div key="chat" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <MessageSquare className="text-sky-400 animate-pulse" size={16} /> KOMUNIKATOR SECURE GOOGLE CHAT
                </span>
                <button onClick={loadChatSpaces} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież czat">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
                {/* Rooms/Spaces List */}
                <div className="md:col-span-4 space-y-2 text-left">
                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Pokoje i Kanały Roju</h3>
                  <div className="border border-white/5 bg-black/20 rounded-2xl divide-y divide-white/5 overflow-hidden">
                    {chatSpaces.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">Brak otwartych pokoi Google Chat. Spróbuj skonfigurować nową strefę w Google Workspace.</div>
                    ) : (
                      chatSpaces.map((space) => (
                        <div
                          key={space.name}
                          onClick={() => {
                            setSelectedSpaceId(space.name);
                            loadSpaceMessages(space.name);
                          }}
                          className={cn(
                            "p-3.5 cursor-pointer hover:bg-sky-500/5 transition-all",
                            selectedSpaceId === space.name ? "bg-sky-950/15 border-l-2 border-sky-400" : ""
                          )}
                        >
                          <div className="font-bold text-white text-xs truncate uppercase font-display">{space.displayName || space.name.split('/')?.[1] || 'Pokój Bez Nazwy'}</div>
                          <span className="text-[8px] bg-neutral-900 text-slate-500 px-1 py-0.5 rounded uppercase mt-1 inline-block border border-white/5">{space.spaceType || 'CH_ROOM'}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Messages Panel */}
                <div className="md:col-span-8 border border-white/5 bg-black/40 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <div className="border-b border-white/5 pb-2.5 mb-3 text-left">
                      <span className="text-[10px] text-sky-400 uppercase font-black">LOGI SYSTEMU DYSKUSYJNEGO</span>
                      <h4 className="text-xs font-bold text-white uppercase truncate font-display">
                        {selectedSpaceId ? `KANAŁ: ${selectedSpaceId.split('/')?.[1]}` : 'NIE WYBRANO KANAŁU'}
                      </h4>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-auto mb-4 p-2 custom-scrollbar">
                      {spaceMessages.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 font-mono">Brak sygnałów przesyłanych w tym kanale.</div>
                      ) : (
                        spaceMessages.map((msg) => (
                          <div key={msg.name} className="flex gap-2.5 items-start text-left bg-black/30 p-2.5 border border-white/5 rounded-xl">
                            <div className="w-6.5 h-6.5 rounded-full bg-sky-950 border border-sky-500/30 text-sky-400 flex items-center justify-center font-bold text-[9px] uppercase">
                              {msg.sender?.displayName?.[0] || 'U'}
                            </div>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-white font-black">{msg.sender?.displayName || 'Nieznany Sender'}</span>
                                <span className="text-[8px] text-slate-500">{new Date(msg.createTime).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-[11px] text-slate-300 leading-tight font-mono">{msg.text}</p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {selectedSpaceId && (
                    <div className="border-t border-white/5 pt-3.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="Wpisz treść depeszy i zatwierdź..."
                        value={newChatMessage}
                        onChange={(e) => setNewChatMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-sky-400"
                      />
                      <button
                        onClick={handleSendChatMessage}
                        className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-black font-black uppercase rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all shrink-0"
                      >
                        <Send size={12} /> Wyślij
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* CALENDAR SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'calendar' && (
            <motion.div key="calendar" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <Calendar className="text-emerald-400 animate-pulse" size={16} /> HARMONOGRAM TELEMETRII [CALENDAR_SYNC]
                </span>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreatingEvent(!isCreatingEvent)} className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-lg text-xs flex items-center gap-1 active:scale-95 transition-all">
                    <Plus size={12} /> Dodaj Wydarzenie
                  </button>
                  <button onClick={loadCalendarEvents} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież kalendarz">
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {isCreatingEvent && (
                <div className="p-4 border border-emerald-500/30 bg-emerald-950/10 rounded-2xl space-y-3 text-left">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-widest border-b border-emerald-500/10 pb-1">Dodawanie nowego terminu</div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2 col-span-2">
                      <input type="text" placeholder="Nazwa wydarzenia / Zadania" value={newEventSummary} onChange={(e) => setNewEventSummary(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emerald-500" />
                      <input type="text" placeholder="Opis szczegółowy (np. dedykowana sekcja orkiestracji)" value={newEventDescription} onChange={(e) => setNewEventDescription(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-emerald-400 font-bold uppercase block pl-1">Rozpoczęcie:</label>
                      <input type="datetime-local" value={newEventStart} onChange={(e) => setNewEventStart(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500" />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-emerald-400 font-bold uppercase block pl-1">Zakończenie:</label>
                      <input type="datetime-local" value={newEventEnd} onChange={(e) => setNewEventEnd(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-1.5 text-xs font-mono text-white focus:border-emerald-500" />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 text-xs border-t border-emerald-500/10 pt-2 mt-3">
                    <button onClick={() => setIsCreatingEvent(false)} className="px-3 py-1.5 border border-white/15 text-slate-400 rounded hover:bg-white/5 uppercase font-medium">Anuluj</button>
                    <button onClick={handleCreateEvent} className="px-4 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black uppercase rounded-lg flex items-center gap-1.5 active:scale-95">
                      <Plus size={12} /> Zapisz w Kalendarzu
                    </button>
                  </div>
                </div>
              )}

              {/* Events lists vertical */}
              <div className="space-y-3 text-left">
                {events.length === 0 ? (
                  <div className="p-12 text-center text-xs text-slate-500 font-mono uppercase bg-neutral-950/40 rounded-2xl">Brak nadchodzących wydarzeń w rejestrach terminarza.</div>
                ) : (
                  events.map((ev) => {
                    const startStr = ev.start?.dateTime || ev.start?.date || '';
                    const endStr = ev.end?.dateTime || ev.end?.date || '';
                    return (
                      <div key={ev.id} className="glass-panel border border-white/5 bg-black/20 p-4 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-emerald-400/40 transition-all">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl flex flex-col items-center justify-center min-w-[55px]">
                            <span className="text-[14px] font-black leading-tight">{new Date(startStr).getDate()}</span>
                            <span className="text-[8px] font-bold uppercase tracking-wider">{new Date(startStr).toLocaleString('default', { month: 'short' })}</span>
                          </div>
                          <div>
                            <h4 className="font-bold text-white text-xs uppercase font-display tracking-tight leading-relaxed">{ev.summary}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5">{ev.description || 'Brak wpisanego szczegółowego komentarza.'}</p>
                            <div className="flex gap-2.5 text-[9px] text-emerald-400 font-mono mt-1 pt-1 border-t border-white/5">
                              <span>START: {new Date(startStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                              <span className="opacity-40">•</span>
                              <span>KONIEC: {new Date(endStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={() => handleDeleteEvent(ev.id, ev.summary)}
                          className="px-2.5 py-1.5 border border-red-500/20 bg-red-950/10 hover:bg-red-950/30 text-red-500 rounded text-[9px] font-black uppercase flex items-center gap-1 active:scale-95 transition-all shrink-0 self-end md:self-auto"
                        >
                          <Trash2 size={11} /> Skasuj Termin
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SHEETS SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'sheets' && (
            <motion.div key="sheets" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <FileSpreadsheet className="text-teal-400 animate-pulse" size={16} /> BAzy I ARKUSZE DANYCH [SHEETS_DATABASE]
                </span>
                <button onClick={loadSpreadsheets} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież arkusze">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-normal">
                {/* Lists spreadsheets */}
                <div className="lg:col-span-3 space-y-2 text-left">
                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Zapisane Skorowidze</h3>
                  <div className="border border-white/5 bg-black/20 rounded-2xl divide-y divide-white/5 overflow-hidden">
                    {spreadsheets.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">Brak dostępnych arkuszy w strefie projektu.</div>
                    ) : (
                      spreadsheets.map((sh) => (
                        <div
                          key={sh.id}
                          onClick={() => {
                            setSelectedSheetId(sh.id);
                            loadSpreadsheetCells(sh.id);
                          }}
                          className={cn(
                            "p-3 cursor-pointer hover:bg-teal-500/5 transition-all text-xs uppercase font-bold text-zinc-300 truncate",
                            selectedSheetId === sh.id ? "bg-teal-950/15 border-l-2 border-teal-400" : ""
                          )}
                        >
                          {sh.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Sheets display Cells */}
                <div className="lg:col-span-9 border border-white/5 bg-black/40 rounded-2xl p-4 flex flex-col justify-between overflow-x-auto">
                  <div>
                    <div className="border-b border-white/5 pb-2 mb-3.5 text-left flex justify-between items-center">
                      <div>
                        <span className="text-[10px] text-teal-400 uppercase font-black">Dynamiczna matryca SQL-Sheet</span>
                        <h4 className="text-xs font-bold text-white uppercase truncate font-display">
                          {sheetData ? `ARKUSZ: ${sheetData.title} (${sheetData.sheetName})` : 'BRAK WYDZIELONEGO ARKUSZA'}
                        </h4>
                      </div>
                    </div>

                    {editCellRow !== null && editCellCol !== null && (
                      <div className="p-3 border border-teal-500/30 bg-teal-950/10 rounded-xl space-y-2 mb-4 text-left">
                        <div className="text-[10px] text-teal-300 uppercase font-bold">Edycja Komórki [Rząd {editCellRow + 1}, Kolumna {String.fromCharCode(65 + editCellCol)}]</div>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={editCellValue}
                            onChange={(e) => setEditCellValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleUpdateSheetCell()}
                            className="bg-black/80 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white w-full"
                          />
                          <button onClick={handleUpdateSheetCell} className="p-1 px-3 bg-teal-500 hover:bg-teal-400 text-black font-black uppercase text-[10px] rounded flex items-center gap-1 active:scale-95">
                            <Check size={11} /> Zapisz
                          </button>
                          <button onClick={() => { setEditCellRow(null); setEditCellCol(null); }} className="p-1 px-2.5 border border-white/10 text-slate-400 hover:bg-white/5 text-[10px] rounded">
                            Anuluj
                          </button>
                        </div>
                      </div>
                    )}

                    <div className="overflow-x-auto border border-white/5 rounded-xl bg-black/30">
                      <table className="w-full text-left border-collapse font-mono text-xs text-slate-300">
                        <thead>
                          <tr className="bg-neutral-900 border-b border-white/5">
                            <th className="p-2 py-1.5 border-r border-white/5 text-center text-slate-600 font-bold bg-neutral-950/50 w-[40px]">#</th>
                            {sheetData?.rows?.[0] ? (
                              sheetData.rows[0].map((_: any, idx: number) => (
                                <th key={idx} className="p-2 py-1.5 border-r border-white/5 text-slate-400 font-bold uppercase tracking-wider text-center">
                                  {String.fromCharCode(65 + idx)}
                                </th>
                              ))
                            ) : (
                              <th className="p-2 py-1.5 text-slate-500 font-bold">A</th>
                            )}
                          </tr>
                        </thead>
                        <tbody>
                          {!sheetData || sheetData.rows.length === 0 ? (
                            <tr>
                              <td colSpan={10} className="p-8 text-center text-xs text-slate-500 font-mono uppercase bg-neutral-950/20">Brak załadowanych linii struktury w tej karcie.</td>
                            </tr>
                          ) : (
                            sheetData.rows.map((row: any[], rIdx: number) => (
                              <tr key={rIdx} className="border-b border-white/5 hover:bg-white/[0.02]">
                                <td className="p-2 py-1.5 border-r border-white/5 text-center bg-neutral-950/20 text-slate-600 font-bold">{rIdx + 1}</td>
                                {row.map((cell: any, cIdx: number) => (
                                  <td
                                    key={cIdx}
                                    onClick={() => {
                                      setEditCellRow(rIdx);
                                      setEditCellCol(cIdx);
                                      setEditCellValue(cell || '');
                                    }}
                                    className="p-2.5 py-1.5 border-r border-white/5 cursor-pointer hover:bg-teal-500/10 transition-all font-sans font-medium text-white max-w-[150px] truncate"
                                    title="Kliknij dwukrotnie lub kliknij, aby edytować"
                                  >
                                    {cell !== undefined ? String(cell) : ''}
                                  </td>
                                ))}
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* SLIDES SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'slides' && (
            <motion.div key="slides" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <Play className="text-indigo-400 animate-pulse" size={16} /> GENERATOR PREZENTACJI [SLIDES_DECK]
                </span>
                <button onClick={loadPresentations} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież prezentacje">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 leading-relaxed text-left">
                {/* Lists decks */}
                <div className="lg:col-span-4 space-y-3">
                  <div className="p-4 border border-indigo-500/30 bg-indigo-950/10 rounded-2xl space-y-3">
                    <div className="text-xs font-bold text-indigo-300 uppercase tracking-widest border-b border-indigo-500/10 pb-1">Utwórz Nowy Deck Prezentacji</div>
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        placeholder="Tytuł nowej prezentacji..."
                        value={newDeckTitle}
                        onChange={(e) => setNewDeckTitle(e.target.value)}
                        className="w-full bg-black/60 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-white focus:border-indigo-500"
                      />
                      <button onClick={handleCreatePresentation} className="w-full py-1.5 bg-indigo-500 hover:bg-indigo-400 text-black font-black uppercase text-[10px] rounded-lg tracking-wider flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                        <Plus size={11} /> Generuj Deck
                      </button>
                    </div>
                  </div>

                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Ostatnio Edytowane Prezenty</h3>
                  <div className="border border-white/5 bg-black/20 rounded-2xl divide-y divide-white/5 overflow-hidden">
                    {presentations.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500 font-mono">Brak prezentacji. Wykorzystaj panel powyżej do wygenerowania pierwszej karty.</div>
                    ) : (
                      presentations.map((pres) => (
                        <div
                          key={pres.id}
                          onClick={() => {
                            setSelectedPresentationId(pres.id);
                            loadPresentationMetadata(pres.id);
                          }}
                          className={cn(
                            "p-3.5 cursor-pointer hover:bg-indigo-500/5 transition-all uppercase font-bold text-zinc-300 text-xs truncate font-display",
                            selectedPresentationId === pres.id ? "bg-indigo-950/15 border-l-2 border-indigo-400" : ""
                          )}
                        >
                          {pres.name}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Slides details metadata wrapper */}
                <div className="lg:col-span-8 border border-white/5 bg-black/40 rounded-2xl p-5 flex flex-col justify-between min-h-[300px]">
                  {presentationMetadata ? (
                    <div className="space-y-4">
                      <div className="border-b border-white/5 pb-2.5">
                        <span className="text-[10px] text-indigo-400 uppercase font-black font-mono">STRUKTURA SLAJDÓW</span>
                        <h4 className="text-sm font-black text-white uppercase truncate font-display tracking-wide">{presentationMetadata.title}</h4>
                      </div>

                      <p className="text-[11px] text-slate-400 leading-relaxed font-mono">
                        Ta prezentacja składa się z <span className="text-white font-bold">{presentationMetadata.slides?.length || 0}</span> slajdów. Poniżej znajduje się zestawienie logicznej struktury obiektów widocznych w chmurze Google.
                      </p>

                      <div className="space-y-2 border border-white/5 bg-black/20 p-3 rounded-xl max-h-[220px] overflow-auto">
                        {!presentationMetadata.slides || presentationMetadata.slides.length === 0 ? (
                          <div className="py-8 text-center text-xs text-slate-500 font-mono uppercase">Prezentacja jest pusta (zawiera jedynie slajd tytułowy).</div>
                        ) : (
                          presentationMetadata.slides.map((sld: any, idx: number) => (
                            <div key={sld.objectId} className="flex gap-3 justify-between items-center p-2.5 bg-black/30 border border-white/5 rounded-lg text-xs font-mono">
                              <span className="text-indigo-400 font-bold">Slajd #{idx + 1}</span>
                              <span className="text-slate-500 truncate max-w-[180px]">ID: {sld.objectId}</span>
                              <span className="px-2 py-0.5 bg-neutral-900 text-slate-400 text-[10px] rounded uppercase border border-white/5">TYPE: STANDARD</span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center flex-1 space-y-2 text-slate-500">
                      <Play size={32} className="opacity-20 text-indigo-400" />
                      <p className="text-xs uppercase font-bold text-slate-600">SEKTOR RENDEROWANIA SLAJDÓW</p>
                      <p className="text-[10px]">Wybierz prezentację, aby załadować strukturę.</p>
                    </div>
                  )}

                  {presentationMetadata && (
                    <div className="border-t border-white/5 pt-3.5 mt-4 flex justify-between items-center text-[10px] text-slate-600 font-bold">
                      <span>DECK_ID: {presentationMetadata.presentationId.substring(0, 16)}...</span>
                      <a href={`https://docs.google.com/presentation/d/${presentationMetadata.presentationId}/edit`} target="_blank" rel="noreferrer" className="px-3 py-1.5 border border-white/10 hover:border-white/20 bg-neutral-950 text-white font-bold uppercase rounded flex items-center gap-1">
                        Otwórz w Google Slides <ExternalLink size={10} />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {/* ======================================================== */}
          {/* TASKS SECTION */}
          {/* ======================================================== */}
          {activeSubTab === 'tasks' && (
            <motion.div key="tasks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4 text-left">
              <div className="flex justify-between items-center border-b border-white/5 pb-3">
                <span className="font-display text-xs uppercase font-black tracking-widest text-white flex items-center gap-2">
                  <CheckSquare className="text-pink-400 animate-pulse" size={16} /> LISTA PRIORYTETÓW OPERACYJNYCH [GOOGLE_TASKS]
                </span>
                <button onClick={loadTaskLists} className="p-1.5 bg-neutral-900 border border-white/10 rounded-lg text-white hover:bg-neutral-800" title="Odśwież zadania">
                  <RefreshCw size={14} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 leading-normal">
                {/* Lists group tasklists */}
                <div className="md:col-span-4 space-y-3">
                  <div className="p-4 border border-pink-500/30 bg-pink-950/10 rounded-2xl space-y-2">
                    <div className="text-xs font-bold text-pink-300 uppercase tracking-widest">Utwórz nową grupę listy</div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nazwa listy..."
                        value={newListName}
                        onChange={(e) => setNewListName(e.target.value)}
                        className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1 text-xs font-mono text-white w-full"
                      />
                      <button onClick={handleCreateTaskList} className="p-1 px-3 bg-pink-500 hover:bg-pink-400 text-black font-black uppercase text-[10px] rounded">
                        + Nowa
                      </button>
                    </div>
                  </div>

                  <h3 className="text-[10px] text-slate-500 font-bold uppercase tracking-wider pl-1.5">Foldery Grupowania</h3>
                  <div className="border border-white/5 bg-black/20 rounded-2xl divide-y divide-white/5 overflow-hidden">
                    {taskLists.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-500">Brak stworzonych list zadań.</div>
                    ) : (
                      taskLists.map((tl) => (
                        <div
                          key={tl.id}
                          onClick={() => {
                            setSelectedTaskListId(tl.id);
                            loadTasksFromList(tl.id);
                          }}
                          className={cn(
                            "p-3 cursor-pointer hover:bg-pink-500/5 transition-all text-xs uppercase font-bold text-zinc-300 truncate",
                            selectedTaskListId === tl.id ? "bg-pink-950/15 border-l-2 border-pink-400" : ""
                          )}
                        >
                          {tl.title}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Tasks elements inside a list */}
                <div className="md:col-span-8 border border-white/5 bg-black/40 rounded-2xl p-4 flex flex-col justify-between min-h-[350px]">
                  <div>
                    <div className="border-b border-white/5 pb-2 mb-3">
                      <span className="text-[10px] text-pink-400 uppercase font-black">REJESTR ZADAŃ AKTYWNYCH</span>
                      <h4 className="text-xs font-bold text-white uppercase truncate font-display">
                        Lokalizacja: {taskLists.find(l => l.id === selectedTaskListId)?.title || 'NIEZNANA SEKCJA'}
                      </h4>
                    </div>

                    <div className="p-3 bg-pink-950/5 border border-pink-500/10 rounded-2xl space-y-2 mb-4">
                      <div className="text-[10px] text-pink-400 font-bold uppercase tracking-wider">Dodaj nowe zadanie chmurowe</div>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        <input
                          type="text"
                          placeholder="Co należy zrobić..."
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white sm:col-span-2"
                        />
                        <input
                          type="date"
                          value={newTaskDue}
                          onChange={(e) => setNewTaskDue(e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white"
                        />
                        <input
                          type="text"
                          placeholder="Dodatkowe komentarze..."
                          value={newTaskNotes}
                          onChange={(e) => setNewTaskNotes(e.target.value)}
                          className="bg-black/60 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs font-mono text-white sm:col-span-2"
                        />
                        <button onClick={handleAddTask} className="py-1.5 bg-pink-500 hover:bg-pink-400 text-black font-black uppercase text-[10px] rounded-lg flex items-center justify-center gap-1 active:scale-95 transition-all">
                          <Plus size={11} /> Wyślij Zadanie
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2 max-h-[220px] overflow-auto mb-4 p-1">
                      {tasks.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-500 font-mono">Brak wpisanych zadań do zrealizowania.</div>
                      ) : (
                        tasks.map((tsk) => {
                          const isCompleted = tsk.status === 'completed';
                          return (
                            <div key={tsk.id} className="flex gap-2.5 justify-between items-center p-3 bg-black/20 border border-white/5 rounded-xl">
                              <div className="flex gap-2.5 items-center truncate">
                                <button
                                  onClick={() => handleToggleTask(tsk.id, tsk.status, tsk.title)}
                                  className={cn(
                                    "p-1 rounded-md border text-slate-600 transition-all cursor-pointer",
                                    isCompleted ? "bg-pink-500/10 border-pink-500 text-pink-400" : "bg-black/40 border-white/15 hover:border-pink-500"
                                  )}
                                >
                                  {isCompleted ? <Check size={11} /> : <div className="w-[11px] h-[11px]" />}
                                </button>
                                <div className="truncate text-left">
                                  <span className={cn("text-xs font-black truncate", isCompleted ? "line-through text-slate-500" : "text-white uppercase")}>
                                    {tsk.title}
                                  </span>
                                  {tsk.notes && <p className="text-[10px] text-slate-500 truncate mt-0.5">{tsk.notes}</p>}
                                </div>
                              </div>
                              {tsk.due && (
                                <span className="text-[8px] bg-neutral-900 border border-white/5 text-slate-500 px-1.5 py-0.5 rounded font-mono uppercase">
                                  Termin: {new Date(tsk.due).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
});
