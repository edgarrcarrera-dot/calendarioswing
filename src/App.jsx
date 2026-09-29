import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken } from 'firebase/auth';
import { 
  getFirestore, collection, onSnapshot, doc, setDoc, deleteDoc 
} from 'firebase/firestore';
import { 
  Calendar as CalendarIcon, List, Plus, Download, X, 
  Settings, Users, DollarSign, MapPin, Clock, Edit2, Trash2,
  Wrench, ArrowRightCircle
} from 'lucide-react';

const appId = typeof __app_id !== 'undefined' ? __app_id : 'calendario-swing';

// Tus credenciales reales de Firebase
const realFirebaseConfig = {
  apiKey: "AIzaSyCpBP8hp1Bi6gmbBk-YXZmEPAYH1KSx7Kw",
  authDomain: "calendario-swing.firebaseapp.com",
  projectId: "calendario-swing",
  storageBucket: "calendario-swing.firebasestorage.app",
  messagingSenderId: "471087970720",
  appId: "1:471087970720:web:5994786d06462cddd20cc5"
};

let parsedSimConfig = {};
try {
  parsedSimConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
} catch(e) {}

const firebaseConfig = Object.keys(parsedSimConfig).length > 0 ? parsedSimConfig : realFirebaseConfig;

let db = null;
let auth = null;

if (Object.keys(firebaseConfig).length > 0) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Error inicializando Firebase:", error);
  }
}

// Generador de ID único
const generateId = () => Math.random().toString(36).substring(2, 15);

// Helper para formato de moneda
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('es-GT', { style: 'currency', currency: 'GTQ' }).format(amount || 0);
};

// Notificación Toast Simple
const Toast = ({ message, type, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const bgColor = type === 'error' ? 'bg-red-500' : 'bg-green-600';
  return (
    <div className={`fixed bottom-4 right-4 ${bgColor} text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2 z-50 animate-bounce`}>
      <span>{message}</span>
    </div>
  );
};

const EventModal = ({ isOpen, onClose, onSave, event, role }) => {
  const [formData, setFormData] = useState({
    title: '',
    type: 'Social',
    clientName: '',
    organizerName: '',
    eventDate: '',
    eventTime: '',
    setupDate: '',
    teardownDate: '',
    venue: '',
    description: '',
    quoteAmount: 0,
    hasAdvance: false,
    advanceAmount: 0
  });

  useEffect(() => {
    if (event) {
      setFormData(event);
    } else {
      // Reset form
      setFormData({
        title: '', type: 'Social', clientName: '', organizerName: '',
        eventDate: '', eventTime: '', setupDate: '', teardownDate: '',
        venue: '', description: '', quoteAmount: 0, hasAdvance: false, advanceAmount: 0
      });
    }
  }, [event, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (type === 'number' ? Number(value) : value)
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const isReadOnly = role === 'reader' || (role === 'creator' && event);
  const showFinancials = role !== 'reader';
  const balance = formData.quoteAmount - (formData.hasAdvance ? formData.advanceAmount : 0);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-40 overflow-y-auto">
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden mt-10 mb-10 max-h-[90vh] flex flex-col">
        
        <div className="bg-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-bold">
            {event ? (isReadOnly ? 'Detalles del Evento' : 'Editar Evento') : 'Nuevo Evento'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-700 rounded-full transition"><X size={24} /></button>
        </div>

        <div className="p-6 overflow-y-auto flex-1">
          <form id="event-form" onSubmit={handleSubmit} className="space-y-6">
            {/* Información General */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-2">Información General</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título del Evento *</label>
                  <input required type="text" name="title" value={formData.title} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Evento</label>
                  <select name="type" value={formData.type} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100">
                    <option value="Social">Social</option>
                    <option value="Corporativo">Corporativo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Cliente *</label>
                  <input required type="text" name="clientName" value={formData.clientName} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Organizador / Planner</label>
                  <input type="text" name="organizerName" value={formData.organizerName} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Venue / Lugar *</label>
                  <input required type="text" name="venue" value={formData.venue} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
              </div>
            </div>

            {/* Fechas y Horarios */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-2">Fechas y Logística</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-green-800 mb-1">Fecha del Evento *</label>
                  <input required type="date" name="eventDate" value={formData.eventDate} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100" />
                </div>
                <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                  <label className="block text-sm font-medium text-green-800 mb-1">Horario del Evento *</label>
                  <input required type="time" name="eventTime" value={formData.eventTime} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100" />
                </div>
                <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                  <label className="block text-sm font-medium text-blue-800 mb-1">Fecha de Montaje (Opcional)</label>
                  <input type="date" name="setupDate" value={formData.setupDate} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                </div>
                <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                  <label className="block text-sm font-medium text-orange-800 mb-1">Fecha de Desmontaje (Opcional)</label>
                  <input type="date" name="teardownDate" value={formData.teardownDate} onChange={handleChange} disabled={isReadOnly}
                    className="w-full p-2 border border-orange-300 rounded-lg focus:ring-2 focus:ring-orange-500 disabled:bg-gray-100" />
                </div>
              </div>
            </div>

            {/* Finanzas (Oculto para Lector) */}
            {showFinancials && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <DollarSign size={16}/> Finanzas
                </h3>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Cotización Total</label>
                      <div className="relative">
                        <span className="absolute left-3 top-2 text-gray-500">$</span>
                        <input type="number" min="0" step="0.01" name="quoteAmount" value={formData.quoteAmount} onChange={handleChange} disabled={isReadOnly}
                          className="w-full pl-8 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                      </div>
                    </div>
                    <div className="flex items-center h-[42px]">
                      <label className="flex items-center cursor-pointer">
                        <input type="checkbox" name="hasAdvance" checked={formData.hasAdvance} onChange={handleChange} disabled={isReadOnly}
                          className="form-checkbox h-5 w-5 text-blue-600 rounded border-gray-300 disabled:opacity-50" />
                        <span className="ml-2 text-sm font-medium text-gray-700">¿Recibió Anticipo?</span>
                      </label>
                    </div>
                    
                    {formData.hasAdvance && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Monto del Anticipo</label>
                        <div className="relative">
                          <span className="absolute left-3 top-2 text-gray-500">$</span>
                          <input type="number" min="0" step="0.01" name="advanceAmount" value={formData.advanceAmount} onChange={handleChange} disabled={isReadOnly}
                            className="w-full pl-8 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100" />
                        </div>
                      </div>
                    )}

                    <div className="bg-white p-3 rounded-lg border-2 border-slate-200 text-center">
                      <span className="block text-xs text-slate-500 font-semibold">SALDO PENDIENTE</span>
                      <span className={`text-lg font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {formatCurrency(balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Descripción */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider border-b pb-2">Detalles Adicionales</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción / Notas</label>
                <textarea name="description" rows="3" value={formData.description} onChange={handleChange} disabled={isReadOnly}
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"></textarea>
              </div>
            </div>
          </form>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t flex justify-end space-x-3 rounded-b-2xl">
          <button type="button" onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition font-medium">
            {isReadOnly ? 'Cerrar' : 'Cancelar'}
          </button>
          {!isReadOnly && (
            <button type="submit" form="event-form" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium flex items-center gap-2">
              Guardar Evento
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CalendarView = ({ events, onSelectEvent, currentDate, setCurrentDate }) => {
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  
  const prevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));

  const days = [];
  const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];

  // Helper para normalizar fechas para comparación (ignora hora)
  const isSameDate = (dateStr1, date2) => {
    if (!dateStr1) return false;
    const [y, m, d] = dateStr1.split('-');
    return parseInt(y) === date2.getFullYear() && 
           parseInt(m) === date2.getMonth() + 1 && 
           parseInt(d) === date2.getDate();
  };

  // Llenar espacios vacíos al principio
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="h-24 bg-slate-50/50 border border-slate-100"></div>);
  }

  // Llenar días del mes
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDayDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), i);
    const isToday = new Date().toDateString() === currentDayDate.toDateString();
    
    // Filtrar eventos para este día
    const dayEvents = events.filter(e => isSameDate(e.eventDate, currentDayDate));
    const daySetups = events.filter(e => isSameDate(e.setupDate, currentDayDate));
    const dayTeardowns = events.filter(e => isSameDate(e.teardownDate, currentDayDate));

    days.push(
      <div key={`day-${i}`} className={`h-24 md:h-32 border border-slate-200 p-1 md:p-2 overflow-y-auto flex flex-col ${isToday ? 'bg-blue-50/30' : 'bg-white'}`}>
        <span className={`text-xs md:text-sm font-semibold mb-1 w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>
          {i}
        </span>
        <div className="flex flex-col gap-1 flex-1">
          {/* Montajes */}
          {daySetups.map(ev => (
            <div key={`setup-${ev.id}`} onClick={() => onSelectEvent(ev)} 
                 className="text-[10px] md:text-xs bg-blue-100 text-blue-800 border border-blue-200 px-1 py-0.5 rounded cursor-pointer truncate flex items-center gap-1 hover:bg-blue-200 transition">
              <Wrench size={10} /> Montaje: {ev.title}
            </div>
          ))}
          {/* Eventos Principales */}
          {dayEvents.map(ev => (
            <div key={`event-${ev.id}`} onClick={() => onSelectEvent(ev)} 
                 className="text-[10px] md:text-xs bg-green-500 text-white px-1 py-0.5 rounded cursor-pointer truncate font-medium flex items-center gap-1 shadow-sm hover:bg-green-600 transition">
              <span className="w-1.5 h-1.5 bg-white rounded-full inline-block"></span>
              {ev.eventTime} - {ev.title}
            </div>
          ))}
          {/* Desmontajes */}
          {dayTeardowns.map(ev => (
            <div key={`tear-${ev.id}`} onClick={() => onSelectEvent(ev)} 
                 className="text-[10px] md:text-xs bg-orange-100 text-orange-800 border border-orange-200 px-1 py-0.5 rounded cursor-pointer truncate flex items-center gap-1 hover:bg-orange-200 transition">
              <ArrowRightCircle size={10} /> Desmontaje: {ev.title}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header del Calendario */}
      <div className="flex justify-between items-center p-4 border-b border-slate-200 bg-slate-50">
        <button onClick={prevMonth} className="p-2 hover:bg-slate-200 rounded-lg transition font-medium text-slate-700">&laquo; Anterior</button>
        <h2 className="text-lg md:text-xl font-bold text-slate-800 capitalize">
          {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <button onClick={nextMonth} className="p-2 hover:bg-slate-200 rounded-lg transition font-medium text-slate-700">Siguiente &raquo;</button>
      </div>
      
      {/* Grid del Calendario */}
      <div className="grid grid-cols-7 text-center">
        {['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'].map(day => (
          <div key={day} className="py-2 text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-white">{day}</div>
        ))}
        {days}
      </div>
    </div>
  );
};

const EventListView = ({ events, onSelectEvent, onDeleteEvent, role }) => {
  // Ordenar eventos por fecha
  const sortedEvents = [...events].sort((a, b) => new Date(a.eventDate) - new Date(b.eventDate));
  
  // Filtrar solo eventos futuros o de hoy
  const today = new Date();
  today.setHours(0,0,0,0);
  const upcomingEvents = sortedEvents.filter(e => {
    if(!e.eventDate) return false;
    const eventDate = new Date(e.eventDate);
    // Ajustar timezone fix simple
    eventDate.setMinutes(eventDate.getMinutes() + eventDate.getTimezoneOffset());
    return eventDate >= today;
  });

  if (upcomingEvents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-dashed border-slate-300">
        <CalendarIcon size={48} className="mx-auto text-slate-300 mb-4" />
        <h3 className="text-lg font-medium text-slate-600">No hay eventos próximos</h3>
        <p className="text-slate-400">Tus próximos eventos aparecerán aquí.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {upcomingEvents.map(ev => {
        const balance = ev.quoteAmount - (ev.hasAdvance ? ev.advanceAmount : 0);
        return (
          <div key={ev.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            
            <div className="flex-1 space-y-2 cursor-pointer w-full" onClick={() => onSelectEvent(ev)}>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase ${ev.type === 'Social' ? 'bg-pink-100 text-pink-700' : 'bg-indigo-100 text-indigo-700'}`}>
                  {ev.type}
                </span>
                <h3 className="text-lg font-bold text-slate-800">{ev.title}</h3>
              </div>
              
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600">
                <div className="flex items-center gap-1"><CalendarIcon size={14}/> {ev.eventDate} ({ev.eventTime})</div>
                <div className="flex items-center gap-1"><MapPin size={14}/> {ev.venue}</div>
                <div className="flex items-center gap-1"><Users size={14}/> {ev.clientName}</div>
              </div>
            </div>

            <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto gap-4 md:gap-2 border-t md:border-t-0 pt-3 md:pt-0">
              {role !== 'reader' && (
                <div className="text-left md:text-right">
                  <div className="text-xs text-slate-500 font-semibold">SALDO</div>
                  <div className={`font-bold ${balance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(balance)}
                  </div>
                </div>
              )}
              
              <div className="flex gap-2">
                <button onClick={() => onSelectEvent(ev)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition" title="Ver Detalles">
                  <Edit2 size={18} />
                </button>
                {role === 'admin' && (
                  <button onClick={() => onDeleteEvent(ev.id)} className="p-2 text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition" title="Eliminar">
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default function App() {
  const [events, setEvents] = useState([]);
  const [view, setView] = useState('calendar'); // 'calendar' | 'list'
  const [role, setRole] = useState('admin'); // 'admin', 'creator', 'reader'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [toast, setToast] = useState(null);
  const [user, setUser] = useState(null);

  // Inicializar Firebase Auth y suscripción a datos
  useEffect(() => {
    if (!auth || !db) return;

    const authInit = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined') {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
        setUser(auth.currentUser);
      } catch (error) {
        console.error("Auth error:", error);
        showToast("Error de conexión", "error");
      }
    };

    authInit();
  }, []);

  useEffect(() => {
    if (!user || !db) return;

    // RULE 1: Strict Paths -> /artifacts/{appId}/public/data/company_events
    const eventsRef = collection(db, 'artifacts', appId, 'public', 'data', 'company_events');
    
    // RULE 2: No Complex Queries -> simple fetch all, sort/filter in memory
    const unsubscribe = onSnapshot(eventsRef, 
      (snapshot) => {
        const eventsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventsData);
      },
      (error) => {
        console.error("Firestore error:", error);
        showToast("Error al cargar eventos", "error");
      }
    );

    return () => unsubscribe();
  }, [user]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
  };

  const handleSaveEvent = async (eventData) => {
    try {
      const id = eventData.id || generateId();
      const payload = { ...eventData, id, updatedAt: new Date().toISOString() };
      
      if (db && user) {
        const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_events', id);
        await setDoc(docRef, payload);
      } else {
        // Fallback local memory si no hay DB
        setEvents(prev => {
          const exists = prev.find(e => e.id === id);
          if (exists) return prev.map(e => e.id === id ? payload : e);
          return [...prev, payload];
        });
      }
      
      showToast(eventData.id ? 'Evento actualizado exitosamente' : 'Evento creado exitosamente');
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (error) {
      console.error("Error guardando:", error);
      showToast("Error al guardar el evento", "error");
    }
  };

  const handleDeleteEvent = async (id) => {
    if(role !== 'admin') return;
    if(window.confirm("¿Estás seguro de eliminar este evento de forma permanente?")) {
      try {
        if (db && user) {
          const docRef = doc(db, 'artifacts', appId, 'public', 'data', 'company_events', id);
          await deleteDoc(docRef);
        } else {
          setEvents(prev => prev.filter(e => e.id !== id));
        }
        showToast("Evento eliminado");
      } catch (error) {
        showToast("Error al eliminar", "error");
      }
    }
  };

  const exportToCSV = () => {
    if (events.length === 0) {
      showToast("No hay datos para exportar", "error");
      return;
    }

    const headers = [
      "Título", "Tipo", "Cliente", "Organizador", "Fecha Evento", "Hora", 
      "Montaje", "Desmontaje", "Lugar", "Cotización", "Anticipo", "Saldo", "Descripción"
    ];

    const csvContent = [
      headers.join(","),
      ...events.map(e => {
        const balance = e.quoteAmount - (e.hasAdvance ? e.advanceAmount : 0);
        const row = [
          `"${e.title || ''}"`,
          `"${e.type || ''}"`,
          `"${e.clientName || ''}"`,
          `"${e.organizerName || ''}"`,
          `"${e.eventDate || ''}"`,
          `"${e.eventTime || ''}"`,
          `"${e.setupDate || ''}"`,
          `"${e.teardownDate || ''}"`,
          `"${e.venue || ''}"`,
          e.quoteAmount || 0,
          e.hasAdvance ? (e.advanceAmount || 0) : 0,
          balance,
          `"${(e.description || '').replace(/"/g, '""')}"`
        ];
        return row.join(",");
      })
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Reporte_Eventos_${new Date().toLocaleDateString().replace(/\//g,'-')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("Archivo CSV descargado");
  };

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20 md:pb-0">
      
      {/* Barra superior: Simulador de Roles */}
      <div className="bg-indigo-900 text-white p-2 text-sm flex justify-center items-center gap-3 shadow-inner">
        <Settings size={16} />
        <span className="opacity-80 hidden md:inline">Simulador de Permisos:</span>
        <select 
          value={role} 
          onChange={(e) => setRole(e.target.value)}
          className="bg-indigo-800 border-none text-white text-sm rounded-md px-2 py-1 focus:ring-0 cursor-pointer font-bold"
        >
          <option value="admin">Administrador (Control Total)</option>
          <option value="creator">Creador (Crear, No Editar)</option>
          <option value="reader">Lector (Solo Lectura, Sin Finanzas)</option>
        </select>
      </div>

      {/* Header Principal */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-4">
            <img 
              src="Diseño sin título (1).png" 
              alt="Swing Logo" 
              className="h-14 md:h-16 w-auto object-contain drop-shadow-sm"
            />
            <div className="hidden sm:block border-l-2 border-slate-200 pl-3">
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Calendario</h1>
              <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Gestión de Eventos</p>
            </div>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2 bg-slate-100 p-1 rounded-xl">
            <button 
              onClick={() => setView('calendar')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition ${view === 'calendar' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <CalendarIcon size={18} /> <span className="hidden sm:inline">Calendario</span>
            </button>
            <button 
              onClick={() => setView('list')}
              className={`flex-1 md:flex-none px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition ${view === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-600 hover:bg-slate-200'}`}
            >
              <List size={18} /> <span className="hidden sm:inline">Próximos</span>
            </button>
            
            <div className="w-px h-8 bg-slate-300 mx-1"></div>
            
            <button 
              onClick={exportToCSV}
              className="px-4 py-2 text-slate-600 hover:text-green-600 hover:bg-green-50 rounded-lg flex items-center justify-center gap-2 font-medium transition"
              title="Exportar a Hoja de Cálculo"
            >
              <Download size={18} /> <span className="hidden sm:inline text-sm">Exportar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {view === 'calendar' ? (
          <CalendarView 
            events={events} 
            onSelectEvent={(ev) => { setSelectedEvent(ev); setIsModalOpen(true); }}
            currentDate={currentDate}
            setCurrentDate={setCurrentDate}
          />
        ) : (
          <EventListView 
            events={events} 
            role={role}
            onSelectEvent={(ev) => { setSelectedEvent(ev); setIsModalOpen(true); }}
            onDeleteEvent={handleDeleteEvent}
          />
        )}
      </main>

      {/* Floating Action Button (Móvil & Escritorio) */}
      {(role === 'admin' || role === 'creator') && (
        <button
          onClick={() => { setSelectedEvent(null); setIsModalOpen(true); }}
          className="fixed bottom-6 right-6 md:bottom-10 md:right-10 bg-blue-600 hover:bg-blue-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all z-30 flex items-center justify-center"
          title="Nuevo Evento"
        >
          <Plus size={32} />
        </button>
      )}

      {/* Modal de Formulario */}
      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }}
        onSave={handleSaveEvent}
        event={selectedEvent}
        role={role}
      />

      {/* Toasts */}
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}

    </div>
  );
}