'use client';

import { useState, useRef } from 'react';
import { useFinanceStore } from '@/lib/store';
import { parseReceiptAmount, parseReceiptDate, todayISO, formatCurrency } from '@/lib/helpers';
import { useToast } from '@/components/Toast';
import { Camera, Upload, ScanLine, Check, Edit3, Loader2 } from 'lucide-react';
import { useMemo } from 'react';
import styles from './scan.module.css';
import CurrencyInput from '@/components/CurrencyInput';

export default function ScanPage() {
    const { categories, addTransaction } = useFinanceStore();
    const { showToast } = useToast();
    const fileRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<'upload' | 'processing' | 'review' | 'done'>('upload');
    const [imageUrl, setImageUrl] = useState<string | null>(null);
    const [ocrText, setOcrText] = useState('');
    const [extractedAmount, setExtractedAmount] = useState('');
    const [extractedDate, setExtractedDate] = useState(todayISO());
    const [selectedCategory, setSelectedCategory] = useState('');
    const [description, setDescription] = useState('');

    const expenseCategories = useMemo(
        () => categories.filter((c) => c.type === 'expense'),
        [categories]
    );

    const handleFile = async (file: File) => {
        const url = URL.createObjectURL(file);
        setImageUrl(url);
        setStep('processing');

        try {
            const Tesseract = await import('tesseract.js');
            const worker = await Tesseract.createWorker('ind+eng');
            const { data: { text } } = await worker.recognize(url);
            await worker.terminate();

            setOcrText(text);

            // Parse extracted data
            const amount = parseReceiptAmount(text);
            const date = parseReceiptDate(text);

            if (amount) setExtractedAmount(amount.toString());
            if (date) setExtractedDate(date);

            // Auto-categorize
            const lowerText = text.toLowerCase();
            if (lowerText.includes('makan') || lowerText.includes('resto') || lowerText.includes('food')) {
                setSelectedCategory('Makanan');
            } else if (lowerText.includes('apotek') || lowerText.includes('farmasi')) {
                setSelectedCategory('Kesehatan');
            } else if (lowerText.includes('mart') || lowerText.includes('belanja') || lowerText.includes('supermarket')) {
                setSelectedCategory('Belanja');
            }

            setStep('review');
        } catch (err) {
            showToast('Gagal memproses gambar', 'error');
            setStep('upload');
        }
    };

    const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
    };

    const handleSave = async () => {
        if (!extractedAmount || !selectedCategory) {
            showToast('Lengkapi jumlah dan kategori!', 'error');
            return;
        }

        await addTransaction({
            date: extractedDate,
            amount: parseFloat(extractedAmount),
            type: 'expense',
            category: selectedCategory,
            description: description || 'Dari scan struk',
        });

        showToast('Transaksi dari struk berhasil disimpan!');
        setStep('done');
    };

    const reset = () => {
        setStep('upload');
        setImageUrl(null);
        setOcrText('');
        setExtractedAmount('');
        setExtractedDate(todayISO());
        setSelectedCategory('');
        setDescription('');
    };

    return (
        <div className="page">
            <h1 className="page-title">Scan Struk</h1>

            {step === 'upload' && (
                <div className={styles.uploadArea}>
                    <div className={styles.uploadBox} onClick={() => fileRef.current?.click()}>
                        <ScanLine size={48} strokeWidth={1.5} />
                        <h3>Upload atau Foto Struk</h3>
                        <p>Ambil foto struk belanja atau upload gambar</p>
                        <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
                            <button className="btn btn-primary btn-sm">
                                <Upload size={16} /> Upload Gambar
                            </button>
                        </div>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleUpload}
                        style={{ display: 'none' }}
                    />
                </div>
            )}

            {step === 'processing' && (
                <div className={styles.processing}>
                    {imageUrl && (
                        <img src={imageUrl} alt="Receipt" className={styles.previewImage} />
                    )}
                    <div className={styles.processingOverlay}>
                        <Loader2 size={40} className={styles.spinIcon} />
                        <p>Memproses struk...</p>
                        <p style={{ fontSize: 'var(--font-xs)', color: 'var(--text-tertiary)' }}>
                            Membaca teks dari gambar
                        </p>
                    </div>
                </div>
            )}

            {step === 'review' && (
                <div>
                    {imageUrl && (
                        <img src={imageUrl} alt="Receipt" className={styles.previewImage} style={{ marginBottom: 'var(--space-lg)' }} />
                    )}

                    <div className="card-flat" style={{ marginBottom: 'var(--space-lg)' }}>
                        <h3 style={{ fontSize: 'var(--font-md)', fontWeight: 600, marginBottom: 'var(--space-md)' }}>
                            <Edit3 size={16} style={{ display: 'inline', marginRight: 6 }} />
                            Data Hasil Scan
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
                            <div className="form-row">
                                <div className="input-group">
                                    <label>Jumlah (Rp)</label>
                                    <CurrencyInput value={extractedAmount} onChange={setExtractedAmount} placeholder="0" />
                                </div>
                                <div className="input-group">
                                    <label>Tanggal</label>
                                    <input type="date" className="input" value={extractedDate} onChange={(e) => setExtractedDate(e.target.value)} />
                                </div>
                            </div>

                            <div className="input-group">
                                <label>Kategori</label>
                                <select className="input" value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                                    <option value="">Pilih kategori</option>
                                    {expenseCategories.map((c) => (
                                        <option key={c.id} value={c.name}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="input-group">
                                <label>Catatan</label>
                                <input type="text" className="input" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Catatan tambahan..." />
                            </div>
                        </div>
                    </div>

                    {ocrText && (
                        <details className={styles.ocrDetails}>
                            <summary>Lihat teks hasil OCR</summary>
                            <pre className={styles.ocrText}>{ocrText}</pre>
                        </details>
                    )}

                    <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-lg)' }}>
                        <button className="btn btn-secondary" style={{ flex: 1 }} onClick={reset}>
                            Batal
                        </button>
                        <button className="btn btn-primary" style={{ flex: 1 }} onClick={handleSave}>
                            <Check size={16} /> Simpan
                        </button>
                    </div>
                </div>
            )}

            {step === 'done' && (
                <div className={styles.doneState}>
                    <div className={styles.doneIcon}>✅</div>
                    <h2>Berhasil Disimpan!</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                        Transaksi {formatCurrency(parseFloat(extractedAmount || '0'))} telah dicatat
                    </p>
                    <button className="btn btn-primary" style={{ marginTop: 'var(--space-lg)' }} onClick={reset}>
                        <ScanLine size={16} /> Scan Lagi
                    </button>
                </div>
            )}
        </div>
    );
}
