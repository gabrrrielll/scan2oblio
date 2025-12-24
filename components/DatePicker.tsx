import React, { useState, useEffect, useRef } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';

interface DatePickerProps {
    value: string;
    onChange: (date: string) => void;
    label?: string;
    placeholder?: string;
    className?: string;
}

const MONTHS_RO = [
    'Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie',
    'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'
];

const DAYS_RO = ['Lu', 'Ma', 'Mi', 'Jo', 'Vi', 'Sâ', 'Du'];

const DatePicker: React.FC<DatePickerProps> = ({ value, onChange, label, placeholder = 'ZZ.LL.AAAA', className = '' }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [viewDate, setViewDate] = useState(new Date()); // For calendar navigation
    const containerRef = useRef<HTMLDivElement>(null);

    // Parse initial value YYYY-MM-DD
    useEffect(() => {
        if (value) {
            const date = new Date(value);
            if (!isNaN(date.getTime())) {
                setViewDate(date);
            }
        }
    }, [value]);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateDisplay = (dateStr: string) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        if (!y || !m || !d) return dateStr;
        return `${d}.${m}.${y}`;
    };

    const handleDateSelect = (day: number) => {
        const year = viewDate.getFullYear();
        const month = viewDate.getMonth() + 1; // 1-12
        const dateStr = `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        onChange(dateStr);
        setIsOpen(false);
    };

    const changeMonth = (delta: number) => {
        const newDate = new Date(viewDate);
        newDate.setMonth(newDate.getMonth() + delta);
        setViewDate(newDate);
    };

    // Calendar logic
    const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
    const getFirstDayOfMonth = (year: number, month: number) => {
        const day = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
        return day === 0 ? 6 : day - 1; // Convert to Mon=0, Sun=6
    };

    const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
    const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
    const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const blanks = Array.from({ length: firstDay }, (_, i) => i);

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>}

            <div
                onClick={() => setIsOpen(!isOpen)}
                className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 flex items-center justify-between cursor-pointer hover:border-slate-600 transition-colors focus-within:ring-2 focus-within:ring-emerald-500"
            >
                <span className={value ? 'text-white' : 'text-slate-500'}>
                    {value ? formatDateDisplay(value) : placeholder}
                </span>
                <CalendarIcon className="w-4 h-4 text-slate-400" />
            </div>

            {isOpen && (
                <div className="absolute z-50 top-full mt-2 left-0 w-72 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl p-4 animate-in fade-in zoom-in-95 duration-100">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-4">
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(-1); }}
                            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="font-semibold text-white">
                            {MONTHS_RO[viewDate.getMonth()]} {viewDate.getFullYear()}
                        </span>
                        <button
                            onClick={(e) => { e.stopPropagation(); changeMonth(1); }}
                            className="p-1 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Days Header */}
                    <div className="grid grid-cols-7 mb-2">
                        {DAYS_RO.map(d => (
                            <div key={d} className="h-8 flex items-center justify-center text-xs font-medium text-slate-500">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1">
                        {blanks.map(i => <div key={`blank-${i}`} />)}
                        {days.map(day => {
                            const isSelected = value === `${viewDate.getFullYear()}-${(viewDate.getMonth() + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                            const isToday = new Date().toDateString() === new Date(viewDate.getFullYear(), viewDate.getMonth(), day).toDateString();

                            return (
                                <button
                                    key={day}
                                    onClick={(e) => { e.stopPropagation(); handleDateSelect(day); }}
                                    className={`
                                        h-8 w-8 rounded-lg text-sm flex items-center justify-center transition-all
                                        ${isSelected
                                            ? 'bg-emerald-600 text-white font-bold shadow-lg shadow-emerald-600/20'
                                            : isToday
                                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                                        }
                                    `}
                                >
                                    {day}
                                </button>
                            );
                        })}
                    </div>

                    {value && (
                        <div className="mt-3 pt-3 border-t border-slate-700">
                            <button
                                onClick={(e) => { e.stopPropagation(); onChange(''); setIsOpen(false); }}
                                className="w-full py-1 text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center justify-center gap-1"
                            >
                                <X className="w-3 h-3" />
                                Șterge data
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default DatePicker;
