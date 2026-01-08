import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, Plus, X } from 'lucide-react';

interface CreatableSelectProps {
    label: string;
    value: string;
    onChange: (value: string) => void;
    options: string[];
    placeholder?: string;
    className?: string;
}

const CreatableSelect: React.FC<CreatableSelectProps> = ({
    label,
    value,
    onChange,
    options,
    placeholder = "Selectează sau scrie...",
    className = ""
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState(value);
    const wrapperRef = useRef<HTMLDivElement>(null);

    // Sync internal state with prop value
    useEffect(() => {
        setSearchTerm(value);
    }, [value]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                // Ensure value is synced on close if user typed something but didn't select
                // Actually, we want onChange to fire as they type potentially? 
                // Or only on blur? For "Creatable", typing IS selecting.
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchTerm.toLowerCase()) && opt !== searchTerm
    );

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setSearchTerm(newValue);
        onChange(newValue);
        setIsOpen(true);
    };

    const handleSelectOption = (option: string) => {
        setSearchTerm(option);
        onChange(option);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={wrapperRef}>
            <label className="block text-xs font-medium text-slate-400 mb-1">{label}</label>
            <div className="relative">
                <input
                    type="text"
                    value={searchTerm}
                    onChange={handleInputChange}
                    onFocus={() => setIsOpen(true)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 pr-8 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    placeholder={placeholder}
                />

                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {/* Clear button if has value */}
                    {searchTerm && (
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setSearchTerm("");
                                onChange("");
                                setIsOpen(true);
                            }}
                            className="text-slate-500 hover:text-white"
                            type="button"
                        >
                            <X className="w-3 h-3" />
                        </button>
                    )}
                    <ChevronDown className={`w-4 h-4 text-slate-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 w-full mt-1 bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                    {filteredOptions.length > 0 ? (
                        filteredOptions.map((option, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => handleSelectOption(option)}
                                className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                            >
                                {option}
                            </button>
                        ))
                    ) : (
                        <div className="px-3 py-2 text-xs text-slate-500 italic">
                            {searchTerm ? "Valoare nouă" : "Începe să scrii..."}
                        </div>
                    )}

                    {/* Explicit "Use X" option if it's a new value */}
                    {searchTerm && !options.includes(searchTerm) && (
                        <button
                            type="button"
                            onClick={() => handleSelectOption(searchTerm)}
                            className="w-full text-left px-3 py-2 text-sm text-emerald-400 hover:bg-slate-700 transition-colors flex items-center gap-2 border-t border-slate-700/50"
                        >
                            <Plus className="w-3 h-3" />
                            Adaugă "{searchTerm}"
                        </button>
                    )}
                </div>
            )}
        </div>
    );
};

export default CreatableSelect;
