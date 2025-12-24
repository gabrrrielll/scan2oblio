import React, { useState, useEffect } from 'react';
import { X, Plus, Search, User, Trash2 } from 'lucide-react';
import { Person } from '../types';
import { getPersonsByType, addPerson, deletePerson, updatePersonLastUsed, generatePersonId, getStoredPersons } from '../services/personStorage';

interface PersonSelectorProps {
    type: 'issuer' | 'deputy' | 'salesAgent';
    label: string;
    value: Person | null;
    onChange: (person: Person | null) => void;
    onFieldsChange: (fields: Record<string, string>) => void;
    placeholder?: string;
}

const PersonSelector: React.FC<PersonSelectorProps> = ({
    type,
    label,
    value,
    onChange,
    onFieldsChange,
    placeholder = 'Selectează sau adaugă...'
}) => {
    const [persons, setPersons] = useState<Person[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [newPerson, setNewPerson] = useState<Partial<Person>>({
        name: '',
        cnp: '',
        identityCard: '',
        auto: ''
    });

    useEffect(() => {
        loadPersons();
    }, [type]);

    const loadPersons = () => {
        const allStored = getStoredPersons();
        console.log('[DEBUG] FULL LOCAL STORAGE content:', allStored);

        const loadedPersons = getPersonsByType(type);
        console.log(`[DEBUG] Loaded persons for current type '${type}':`, loadedPersons);

        setPersons(loadedPersons);
    };

    const filteredPersons = persons.filter(p =>
        p && p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectPerson = (person: Person) => {
        onChange(person);
        updatePersonLastUsed(person.id, type);

        // Auto-fill câmpuri asociate
        const fields: Record<string, string> = {};
        if (type === 'issuer' && person.cnp) {
            fields.issuerId = person.cnp;
        } else if (type === 'deputy') {
            if (person.identityCard) fields.deputyIdentityCard = person.identityCard;
            if (person.auto) fields.deputyAuto = person.auto;
        }

        if (Object.keys(fields).length > 0) {
            onFieldsChange(fields);
        }

        setShowDropdown(false);
        setSearchTerm('');
    };

    const handleAddNewPerson = () => {
        if (!newPerson.name?.trim()) return;

        const person: Person = {
            id: generatePersonId(),
            name: newPerson.name.trim(),
            type,
            cnp: newPerson.cnp?.trim() || undefined,
            identityCard: newPerson.identityCard?.trim() || undefined,
            auto: newPerson.auto?.trim() || undefined
        };

        addPerson(person);
        loadPersons();
        handleSelectPerson(person);

        // Reset form
        setNewPerson({
            name: '',
            cnp: '',
            identityCard: '',
            auto: ''
        });
        setShowAddModal(false);
    };

    const handleDeletePerson = (personId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Sigur vrei să ștergi această persoană?')) {
            deletePerson(personId, type);
            loadPersons();
            if (value?.id === personId) {
                onChange(null);
            }
        }
    };

    const handleClear = () => {
        onChange(null);
        onFieldsChange(
            type === 'issuer'
                ? { issuerId: '' }
                : type === 'deputy'
                    ? { deputyIdentityCard: '', deputyAuto: '' }
                    : {}
        );
    };

    return (
        <div className={`relative ${showDropdown ? 'z-50' : 'z-auto'}`}>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>

            {/* Selected Person Display */}
            {value ? (
                <div className="bg-slate-900 border border-emerald-600 rounded-lg px-4 py-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <User className="w-4 h-4 text-emerald-400" />
                        <span className="text-white font-medium">{value.name}</span>
                        {type === 'issuer' && value.cnp && (
                            <span className="text-xs text-slate-400">CNP: {value.cnp}</span>
                        )}
                    </div>
                    <button
                        onClick={handleClear}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            ) : (
                <>
                    {/* Search Input */}
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setShowDropdown(true);
                            }}
                            onFocus={() => setShowDropdown(true)}
                            placeholder={placeholder}
                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 pr-10 focus:ring-2 focus:ring-emerald-500 outline-none"
                        />
                        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    </div>

                    {/* Dropdown */}
                    {showDropdown && (
                        <>
                            <div
                                className="fixed inset-0 z-10"
                                onClick={() => setShowDropdown(false)}
                            />
                            <div className="absolute z-20 mt-2 w-full bg-slate-800 border border-slate-700 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                                {/* Add New Button */}
                                <button
                                    onClick={() => {
                                        setShowAddModal(true);
                                        setShowDropdown(false);
                                    }}
                                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition-colors border-b border-slate-700 flex items-center gap-2 text-emerald-400"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span className="font-medium">Adaugă {label} Nou</span>
                                </button>

                                {/* Person List */}
                                {filteredPersons.length > 0 ? (
                                    filteredPersons.map(person => (
                                        <div
                                            key={person.id}
                                            onClick={() => handleSelectPerson(person)}
                                            className="px-4 py-3 hover:bg-slate-700 transition-colors cursor-pointer flex items-center justify-between group"
                                        >
                                            <div>
                                                <div className="text-white font-medium">{person.name}</div>
                                                {type === 'issuer' && person.cnp && (
                                                    <div className="text-xs text-slate-400">CNP: {person.cnp}</div>
                                                )}
                                                {type === 'deputy' && (
                                                    <div className="text-xs text-slate-400">
                                                        {person.identityCard && `CI: ${person.identityCard}`}
                                                        {person.identityCard && person.auto && ' • '}
                                                        {person.auto && `Auto: ${person.auto}`}
                                                    </div>
                                                )}
                                            </div>
                                            <button
                                                onClick={(e) => handleDeletePerson(person.id, e)}
                                                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 transition-opacity"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-4 py-8 text-center text-slate-400">
                                        {searchTerm
                                            ? `Nu s-au găsit rezultate (${persons.length} salvate)`
                                            : `Nicio persoană salvată (${persons.length})`
                                        }
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            )}

            {/* Add New Person Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
                    <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-white">Adaugă {label} Nou</h3>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-white transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            {/* Name */}
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-1">
                                    Nume {label} *
                                </label>
                                <input
                                    type="text"
                                    value={newPerson.name || ''}
                                    onChange={(e) => setNewPerson(prev => ({ ...prev, name: e.target.value }))}
                                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                    placeholder="Ex: Ion Popescu"
                                    autoFocus
                                />
                            </div>

                            {/* Issuer: CNP */}
                            {type === 'issuer' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">
                                        CNP
                                    </label>
                                    <input
                                        type="text"
                                        value={newPerson.cnp || ''}
                                        onChange={(e) => setNewPerson(prev => ({ ...prev, cnp: e.target.value }))}
                                        className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                        placeholder="1234567890123"
                                        maxLength={13}
                                    />
                                </div>
                            )}

                            {/* Deputy: Identity Card & Auto */}
                            {type === 'deputy' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">
                                            CI Delegat
                                        </label>
                                        <input
                                            type="text"
                                            value={newPerson.identityCard || ''}
                                            onChange={(e) => setNewPerson(prev => ({ ...prev, identityCard: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Ex: CT 123456"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">
                                            Auto Delegat
                                        </label>
                                        <input
                                            type="text"
                                            value={newPerson.auto || ''}
                                            onChange={(e) => setNewPerson(prev => ({ ...prev, auto: e.target.value }))}
                                            className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-emerald-500 outline-none"
                                            placeholder="Ex: CT 12 ABC"
                                        />
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="mt-6 flex gap-3">
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="flex-1 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition-colors"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleAddNewPerson}
                                disabled={!newPerson.name?.trim()}
                                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Adaugă
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PersonSelector;
