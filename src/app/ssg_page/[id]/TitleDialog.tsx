'use client';

import { useState } from 'react';

function formatTimestamp(): string {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const milliseconds = String(now.getMilliseconds()).padStart(3, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
}

export default function TitleDialog({ title, randomNumber }: { title: string; randomNumber: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentTimestamp, setCurrentTimestamp] = useState<string>('');

    const handleOpen = () => {
        setCurrentTimestamp(formatTimestamp());
        setIsOpen(true);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                style={{
                    padding: '10px 20px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    marginTop: '10px'
                }}
            >
                Show Page Title
            </button>

            {isOpen && (
                <div
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setIsOpen(false)}
                >
                    <div
                        style={{
                            backgroundColor: 'white',
                            padding: '30px',
                            borderRadius: '8px',
                            maxWidth: '500px',
                            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <h2 style={{ marginTop: 0, marginBottom: '15px' }}>Page Title</h2>
                        <p style={{ fontSize: '18px', marginBottom: '10px' }}><strong>Title:</strong> {title}</p>
                        <p style={{ fontSize: '14px', marginBottom: '10px', color: '#666' }}><strong>Timestamp:</strong> {currentTimestamp}</p>
                        <p style={{ fontSize: '14px', marginBottom: '20px', color: '#28a745' }}><strong>Random Number (Build Time):</strong> {randomNumber}</p>
                        <button
                            onClick={() => setIsOpen(false)}
                            style={{
                                padding: '8px 16px',
                                backgroundColor: '#6c757d',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
