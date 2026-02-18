'use client';

import { useState, useEffect, useRef } from 'react';

interface CurrencyInputProps {
    value: string;
    onChange: (raw: string) => void;
    placeholder?: string;
    required?: boolean;
    min?: number;
    className?: string;
}

/**
 * Format number string with thousand separators (Indonesian style: 1.000.000)
 * Returns raw numeric string via onChange for form data
 */
export default function CurrencyInput({
    value,
    onChange,
    placeholder = '0',
    required = false,
    min,
    className = 'input',
}: CurrencyInputProps) {
    const formatDisplay = (raw: string): string => {
        const digits = raw.replace(/\D/g, '');
        if (!digits) return '';
        return Number(digits).toLocaleString('id-ID');
    };

    const [display, setDisplay] = useState(() => formatDisplay(value));
    const inputRef = useRef<HTMLInputElement>(null);

    // Sync if external value changes
    useEffect(() => {
        setDisplay(formatDisplay(value));
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value.replace(/\D/g, '');
        setDisplay(formatDisplay(raw));
        onChange(raw);
    };

    return (
        <input
            ref={inputRef}
            type="text"
            inputMode="numeric"
            className={className}
            placeholder={placeholder}
            value={display}
            onChange={handleChange}
            required={required}
        />
    );
}
