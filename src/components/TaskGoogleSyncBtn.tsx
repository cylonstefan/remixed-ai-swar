import React, { useState, useEffect } from 'react';
import { getAccessToken, googleSignIn } from '../services/googleAuth';
import { api } from '../services/api';
import { Task } from '../types';
import { FileText, RefreshCw, Link, Unlink, ExternalLink, X, Eye, Sparkles, FolderOpen, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const TaskGoogleSyncBtn = ({ tasks, loadTasks, showToast }: { tasks: Task[], loadTasks: () => void, showToast?: (msg: string) => void }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDocsOpen, setIsDocsOpen] = useState(false);
  
  // Google Docs Preview States
  const [driveDocs, setDriveDocs] = useState<any[]>([]);
  const [isLoadingDocs, setIsLoadingDocs] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<string>('');
  const [customLinkInput, setCustomLinkInput] = useState<string>('');
  const [assignedTaskId, setAssignedTaskId] = useState<string>('');
  const [docPairings, setDocPairings] = useState<Record<string, { docIdOrUrl: string; docName?: string }>>({});

  // Load pairings on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('cylon_task_gdocs');
      if (stored) {
        setDocPairings(JSON.parse(stored));
      }
    } catch (e) {
      console.error("Error reading doc pairings", e);
    }
  }, []);

  const savePairings = (newPairings: Record<string, { docIdOrUrl: string; docName?: string }>) => {
    setDocPairings(newPairings);
    localStorage.setItem('cylon_task_gdocs', JSON.stringify(newPairings));
  };

  const extractDocId = (input: string) => {
    if (!input) return '';
    const match = input.match(/\/document\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : input.trim();
  };

  const handleSyncWithGoogleTasks = async () => {
    try {
      setIsSyncing(true);
      let token = await getAccessToken();
      if (!token) {
        if (!window.confirm("Rozpocząć autoryzację w Google Workspace, aby zsynchronizować zadania?")) return;
        const result = await googleSignIn();
        if (result) token = result.accessToken;
      }
      if (!token) return;

      if (showToast) showToast("Rozpoczynam dwukierunkową synchronizację z Google Tasks...");

      const headers = { Authorization: `Bearer ${token}` };
      
      const listsRes = await fetch("https://tasks.googleapis.com/tasks/v1/users/@me/lists", { headers });
      if (!listsRes.ok) throw new Error("Nie udało się pobrać list zadań Google.");
      const listsData = await listsRes.json();
      const defaultList = listsData.items?.[0];
      if (!defaultList) throw new Error("Brak list zadań.");

      const listId = defaultList.id;
      const gTasksRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks?showHidden=true`, { headers });
      const gTasksData = await gTasksRes.json();
      const gTasks = gTasksData.items || [];

      let newFromGoogle = 0; let matchedLocal = 0; let pushedToGoogle = 0;

      for (const gTask of gTasks) {
        const existingLocal = tasks.find(t => t.googleTaskId === gTask.id || t.title === gTask.title);
        const gStatus: Task['status'] = gTask.status === 'completed' ? 'done' : 'todo';
        if (!existingLocal) {
          await api.createTask({
            id: Math.random().toString(36).substr(2, 9),
            title: gTask.title || 'Zadanie bez tytułu',
            status: gStatus,
            priority: 'medium',
            googleTaskId: gTask.id
          });
          newFromGoogle++;
        } else {
          await api.updateTaskStatus(existingLocal.id, gStatus);
          if (!existingLocal.googleTaskId) {
             await fetch(`/api/tasks/${existingLocal.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ googleTaskId: gTask.id })
             });
          }
          matchedLocal++;
        }
      }

      for (const localTask of tasks) {
        if (!localTask.googleTaskId) {
          const createRes = await fetch(`https://tasks.googleapis.com/tasks/v1/lists/${listId}/tasks`, {
            method: 'POST',
            headers: { ...headers, 'Content-Type': 'application/json' },
            body: JSON.stringify({
              title: localTask.title,
              status: localTask.status === 'done' ? 'completed' : 'needsAction'
            })
          });
          if (createRes.ok) {
            const newGTask = await createRes.json();
            await fetch(`/api/tasks/${localTask.id}`, {
               method: 'PATCH',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ googleTaskId: newGTask.id })
            });
            pushedToGoogle++;
          }
        }
      }

      loadTasks();
      if (showToast) showToast(`Synchronizacja zakończona! Pobrane z GTasks: ${newFromGoogle}, Zaktualizowane: ${matchedLocal}, Wypchnięte do GTasks: ${pushedToGoogle}`);
      
    } catch (e: any) {
      console.error(e);
      alert("Błąd synchronizacji: " + e.message);
    } finally {
      setIsSyncing(false);
    }
  };

  const fetchDriveDocs = async () => {
    try {
      setIsLoadingDocs(true);
      let token = await getAccessToken();
      if (!token) {
        const result = await googleSignIn();
        if (result) token = result.accessToken;
      }
      if (!token) {
        setIsLoadingDocs(false);
        return;
      }

      const res = await fetch(
        "https://www.googleapis.com/drive/v3/files?q=mimeType%3D'application%2Fvnd.google-apps.document'&fields=files(id%2Cname%2CwebViewLink)&pageSize=20",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (res.ok) {
        const data = await res.json();
        setDriveDocs(data.files || []);
        if (showToast) showToast(`Pomyślnie wczytano ${data.files?.length || 0} plików tekstowych Google Docs!`);
      } else {
        if (showToast) showToast("Nie udało się pobrać dokumentów z Google Drive.");
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) showToast("Błąd przy pobieraniu Drive API: " + err.message);
    } finally {
      setIsLoadingDocs(false);
    }
  };

  const handleLinkCustomDoc = () => {
    if (!assignedTaskId) {
      alert("Wybierz zadanie, do którego chcesz przypisać dokument.");
      return;
    }
    if (!customLinkInput) {
      alert("Wklej poprawny link lub identyfikator Google Doc.");
      return;
    }
    const cleanId = extractDocId(customLinkInput);
    if (!cleanId) {
      alert("Nie udało się wyodrębnić ID dokumentu.");
      return;
    }

    const task = tasks.find(t => t.id === assignedTaskId);
    const updated = { ...docPairings };
    updated[assignedTaskId] = {
      docIdOrUrl: cleanId,
      docName: task ? task.title : `Dokument dla zadania [${assignedTaskId}]`
    };
    savePairings(updated);
    setSelectedDocId(cleanId);
    setCustomLinkInput('');
    if (showToast) showToast(`Udane powiązanie dokumentu z zadaniem: ${task?.title || 'Zadanie'}`);
  };

  const handleLinkDriveDoc = (doc: { id: string; name: string }) => {
    if (!assignedTaskId) {
      alert("Najpierw wybierz zadanie z listy po lewej, a potem kliknij ikonę przypisania.");
      return;
    }
    const updated = { ...docPairings };
    updated[assignedTaskId] = {
      docIdOrUrl: doc.id,
      docName: doc.name
    };
    savePairings(updated);
    setSelectedDocId(doc.id);
    if (showToast) showToast(`Przypisano dokument "${doc.name}" do zadania!`);
  };

  const handleUnlinkDoc = (taskId: string) => {
    const updated = { ...docPairings };
    delete updated[taskId];
    savePairings(updated);
    if (selectedDocId === docPairings[taskId]?.docIdOrUrl) {
      setSelectedDocId('');
    }
    if (showToast) showToast("Dokument został odlutowany od zadania.");
  };

  const extractedSelectedId = extractDocId(selectedDocId);
  const activeIframeSrc = extractedSelectedId 
    ? `https://docs.google.com/document/d/${extractedSelectedId}/edit?embedded=true` 
    : '';

  return (
    <div className="flex items-center gap-2">
      <button 
        onClick={handleSyncWithGoogleTasks}
        disabled={isSyncing}
        className={`border border-[#4285F4]/40 text-[#4285F4] px-3 py-1.5 hover:bg-[#4285F4]/10 hover:text-white flex items-center gap-2 text-[10px] rounded-xl font-mono transition-all uppercase font-bold ${isSyncing ? 'opacity-50 cursor-wait' : ''}`}
        title="Synchronizuj zadania z główną listą Google Tasks"
      >
        {isSyncing ? "SYNCING..." : "SYNC G-TASKS"}
      </button>

      <button
        onClick={() => {
          setIsDocsOpen(true);
          fetchDriveDocs();
        }}
        className="border border-[#0F9D58]/40 text-[#0F9D58] px-3 py-1.5 hover:bg-[#0F9D58]/10 hover:text-white flex items-center gap-2 text-[10px] rounded-xl font-mono transition-all uppercase font-bold"
        title="Otwórz panel podglądu powiązanych dokumentów Google Docs"
      >
        <FileText size={12} /> PODGLĄD DOCS
      </button>

      <AnimatePresence>
        {isDocsOpen && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[999] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-neutral-900 border border-white/10 w-full max-w-6xl h-[85vh] rounded-3xl flex flex-col overflow-hidden shadow-2xl"
            >
              {/* Header */}
              <div className="px-6 py-4 bg-neutral-950 border-b border-white/5 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                    <FileText className="text-[#4285F4]" size={18} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold font-mono tracking-tight text-sm uppercase">Cylon Workspace: Podgląd Google Docs</h3>
                    <p className="text-[10px] text-slate-400">Przeglądaj wbudowane dokumenty powiązane z zadaniami</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsDocsOpen(false)}
                  className="p-2 hover:bg-white/5 text-slate-400 hover:text-white rounded-xl transition"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Main Workspace Grid */}
              <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
                {/* Control Panel Block */}
                <div className="lg:col-span-4 border-r border-white/5 p-6 space-y-6 overflow-y-auto bg-neutral-950/40">
                  
                  {/* Step 1: Assign Task Target */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles size={12} className="text-acid-cyan" /> 1. Wybierz powiązane zadanie
                    </label>
                    <select 
                      value={assignedTaskId}
                      onChange={e => setAssignedTaskId(e.target.value)}
                      className="modern-input w-full text-xs"
                    >
                      <option value="">Wybierz zadanie...</option>
                      {tasks.map(t => (
                        <option key={t.id} value={t.id}>
                          [{t.status.toUpperCase()}] {t.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Step 2: Input or Choose File */}
                  <div className="space-y-4 pt-2">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <FolderOpen size={12} className="text-acid-cyan" /> 2. Podepnij Google Doc
                    </label>

                    {/* Custom Link Paste Option */}
                    <div className="space-y-2 bg-white/5 p-3 rounded-xl border border-white/5">
                      <div className="text-[10px] text-slate-400 font-bold">Wklej adres URL lub identyfikator dokumentu</div>
                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          placeholder="https://docs.google.com/document/d/..."
                          value={customLinkInput}
                          onChange={e => setCustomLinkInput(e.target.value)}
                          className="modern-input flex-1 text-xs py-1.5"
                        />
                        <button 
                          onClick={handleLinkCustomDoc}
                          className="px-3 bg-acid-cyan text-black rounded-lg text-xs font-bold hover:opacity-90 transition flex items-center gap-1"
                        >
                          <Link size={14} /> Podepnij
                        </button>
                      </div>
                    </div>

                    {/* Integrated Drive Documents list fetch */}
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="text-[10px] text-slate-400 font-bold">Wybierz z konta Google Drive</div>
                        <button 
                          onClick={fetchDriveDocs}
                          disabled={isLoadingDocs}
                          className="text-[10px] text-acid-cyan hover:underline flex items-center gap-1 disabled:opacity-50"
                        >
                          <RefreshCw size={10} className={isLoadingDocs ? 'animate-spin' : ''} /> Odśwież listę
                        </button>
                      </div>

                      <div className="max-h-44 overflow-y-auto space-y-1 pr-1 border border-white/5 rounded-xl bg-black/20 p-2">
                        {isLoadingDocs ? (
                          <div className="text-center py-4 text-xs text-slate-400">Pobieranie plików...</div>
                        ) : driveDocs.length === 0 ? (
                          <div className="text-center py-4 text-xs text-slate-400 flex flex-col items-center gap-2">
                            <span>Brak wczytanych dokumentów Google Docs.</span>
                            <button 
                              onClick={fetchDriveDocs}
                              className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white font-bold"
                            >
                              POBIERZ Z DRIVE
                            </button>
                          </div>
                        ) : (
                          driveDocs.map(doc => {
                            const isCurrentlySelected = selectedDocId === doc.id;
                            return (
                              <div 
                                key={doc.id}
                                className={`p-2 rounded-lg text-xs transition cursor-pointer flex justify-between items-center ${isCurrentlySelected ? 'bg-acid-cyan/10 border border-acid-cyan/30 text-acid-cyan' : 'hover:bg-white/5 border border-transparent text-slate-300'}`}
                                onClick={() => setSelectedDocId(doc.id)}
                              >
                                <span className="truncate pr-2 font-mono flex-1">{doc.name}</span>
                                <div className="flex items-center gap-1.5">
                                  <button 
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleLinkDriveDoc(doc);
                                    }}
                                    className="p-1 hover:bg-white/10 rounded text-acid-cyan"
                                    title="Powiąż ten plik z wybranym zadaniem"
                                  >
                                    <Link size={12} />
                                  </button>
                                  <a 
                                    href={doc.webViewLink} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-1 hover:bg-white/10 rounded text-slate-400"
                                  >
                                    <ExternalLink size={12} />
                                  </a>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    </div>
                  </div>

                  {/* List of active linked documents per task */}
                  <div className="space-y-2 pt-2 border-t border-white/5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Eye size={12} className="text-acid-cyan" /> Aktywne powiązania w systemie
                    </label>

                    {Object.keys(docPairings).length === 0 ? (
                      <div className="text-xs text-slate-500 italic p-3 text-center border border-dashed border-white/5 rounded-xl">
                        Brak powiązanych plików.
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                        {Object.entries(docPairings).map(([taskId, data]) => {
                          const isCurrentlyPlaying = selectedDocId === data.docIdOrUrl;
                          return (
                            <div 
                              key={taskId}
                              className={`p-2 rounded-xl text-xs flex justify-between items-center transition border ${isCurrentlyPlaying ? 'bg-acid-purple/10 border-acid-purple/40 text-acid-purple' : 'bg-white/[0.02] border-white/5 text-slate-300'}`}
                            >
                              <div 
                                className="flex-1 min-w-0 cursor-pointer"
                                onClick={() => setSelectedDocId(data.docIdOrUrl)}
                              >
                                <span className="font-bold truncate block">{data.docName || 'Plik Google Docs'}</span>
                                <span className="text-[9px] text-slate-400 block truncate">Powiązanie: {tasks.find(t => t.id === taskId)?.title || 'Nieznane zadanie'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => setSelectedDocId(data.docIdOrUrl)}
                                  className="p-1 hover:bg-white/10 rounded text-acid-cyan"
                                  title="Otwórz podgląd"
                                >
                                  <Eye size={12} />
                                </button>
                                <button 
                                  onClick={() => handleUnlinkDoc(taskId)}
                                  className="p-1 hover:bg-white/10 rounded text-red-500"
                                  title="Usuń powiązanie"
                                >
                                  <Unlink size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Live Preview Embed Box */}
                <div className="lg:col-span-8 flex flex-col bg-neutral-950 p-6 overflow-hidden relative">
                  {selectedDocId ? (
                    <div className="flex-1 flex flex-col overflow-hidden relative">
                      <div className="flex justify-between items-center pb-3 border-b border-white/5 mb-3">
                        <div className="flex items-center gap-2">
                          <Check className="text-acid-green animate-pulse" size={14} />
                          <span className="text-xs text-white font-mono truncate max-w-md">
                            Aktywny plik ID: <span className="text-acid-cyan">{extractedSelectedId}</span>
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button 
                            onClick={() => {
                              const src = activeIframeSrc;
                              setSelectedDocId('');
                              setTimeout(() => setSelectedDocId(src), 150);
                            }}
                            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-400 hover:text-white transition"
                            title="Odśwież dokument"
                          >
                            <RefreshCw size={14} />
                          </button>
                          <a 
                            href={`https://docs.google.com/document/d/${extractedSelectedId}/edit`} 
                            target="_blank" 
                            rel="noreferrer"
                            className="p-1.5 hover:bg-white/5 rounded-lg text-slate-300 hover:text-white transition flex items-center gap-1 text-[10px] font-mono border border-white/10 uppercase"
                          >
                            Zewnętrzny link <ExternalLink size={12} />
                          </a>
                        </div>
                      </div>

                      {/* The iframe rendering the Embedded Google Doc */}
                      <div className="flex-1 bg-neutral-900 rounded-2xl overflow-hidden border border-white/10 relative shadow-inner">
                        <iframe 
                          src={activeIframeSrc}
                          className="w-full h-full border-0 rounded-2xl bg-white"
                          allow="autoplay"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center space-y-4">
                      <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                        <FileText className="text-slate-500" size={32} />
                      </div>
                      <div>
                        <h4 className="text-white font-bold font-mono text-xs uppercase">Brak otwartego dokumentu podglądu</h4>
                        <p className="text-[10px] text-slate-400 max-w-sm mt-1">Wybierz jeden z powiązanych plików, wklej link ręcznie lub pobierz aktualną listę z Google Drive, aby wczytać podgląd wewnątrz tej ramki.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
