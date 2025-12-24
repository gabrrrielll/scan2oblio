import { Person, StoredPersons } from '../types';

const STORAGE_KEY = 'scan2oblio_persons';

/**
 * Obține toate persoanele salvate din localStorage
 */
export const getStoredPersons = (): StoredPersons => {
    const defaults: StoredPersons = {
        issuers: [],
        deputies: [],
        salesAgents: []
    };

    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        console.log('[DEBUG] Raw localStorage value:', stored);
        if (!stored) {
            return defaults;
        }
        const parsed = JSON.parse(stored);
        // Merge with defaults to ensure all arrays exist
        return { ...defaults, ...parsed };
    } catch (error) {
        console.error('Error loading persons from localStorage:', error);
        return defaults;
    }
};

/**
 * Salvează toate persoanele în localStorage
 */
export const saveStoredPersons = (persons: StoredPersons): void => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(persons));
    } catch (error) {
        console.error('Error saving persons to localStorage:', error);
    }
};

/**
 * Adaugă o persoană nouă
 */
export const addPerson = (person: Person): void => {
    const persons = getStoredPersons();
    const listKey = getListKey(person.type);

    // Verifică dacă persoana există deja (după nume)
    const existingIndex = persons[listKey].findIndex(
        p => p.name.toLowerCase() === person.name.toLowerCase()
    );

    if (existingIndex >= 0) {
        // Actualizează persoana existentă
        persons[listKey][existingIndex] = {
            ...person,
            lastUsed: new Date().toISOString()
        };
    } else {
        // Adaugă persoană nouă
        persons[listKey].push({
            ...person,
            lastUsed: new Date().toISOString()
        });
    }

    saveStoredPersons(persons);
};

/**
 * Actualizează data ultimei utilizări pentru o persoană
 */
export const updatePersonLastUsed = (personId: string, type: Person['type']): void => {
    const persons = getStoredPersons();
    const listKey = getListKey(type);

    const personIndex = persons[listKey].findIndex(p => p.id === personId);
    if (personIndex >= 0) {
        persons[listKey][personIndex].lastUsed = new Date().toISOString();
        saveStoredPersons(persons);
    }
};

/**
 * Șterge o persoană
 */
export const deletePerson = (personId: string, type: Person['type']): void => {
    const persons = getStoredPersons();
    const listKey = getListKey(type);

    persons[listKey] = persons[listKey].filter(p => p.id !== personId);
    saveStoredPersons(persons);
};

/**
 * Obține lista de persoane pentru un tip specific, sortate după ultima utilizare
 */
export const getPersonsByType = (type: Person['type']): Person[] => {
    const persons = getStoredPersons();
    const listKey = getListKey(type);

    return persons[listKey].sort((a, b) => {
        const dateA = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
        const dateB = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
        return dateB - dateA; // Cele mai recente primele
    });
};

/**
 * Helper pentru a obține cheia listei în funcție de tip
 */
const getListKey = (type: Person['type']): keyof StoredPersons => {
    switch (type) {
        case 'issuer':
            return 'issuers';
        case 'deputy':
            return 'deputies';
        case 'salesAgent':
            return 'salesAgents';
    }
};

/**
 * Generează un ID unic pentru o persoană
 */
export const generatePersonId = (): string => {
    return `person_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};
