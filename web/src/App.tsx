import { useRef, useState } from "react";
import "./App.css";

function App() {
    const [pickupKey, setPickupKey] = useState<string | null>(null);
    const [fileExt, setFileExt] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<number>(0);
    const [downloadKey, setDownloadKey] = useState("");
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const [copiedId, setCopiedId] = useState(false);
    const [copiedLink, setCopiedLink] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop/upload
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        setUploading(true);
        setPickupKey(null);
        setFileExt(null);
        setUploadProgress(0);

        const file = files[0];
        // Store file extension
        const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
        setFileExt(extMatch ? extMatch[1] : "");
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/deaddrop", true);
            xhr.setRequestHeader("Content-Type", file.type);
            const filename = encodeURIComponent(file.name);
            xhr.setRequestHeader("Content-Disposition", `attachment; filename="${filename}"`);

            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) {
                    const percent = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(percent);
                }
            };

            xhr.onload = () => {
                setUploading(false);
                setUploadProgress(0);
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setPickupKey(data.id);
                } else {
                    setPickupKey("Error uploading file");
                }
            };

            xhr.onerror = () => {
                setUploading(false);
                setUploadProgress(0);
                setPickupKey("Error uploading file");
            };
            xhr.send(file);

        } catch (err) {
            console.error("Upload error:", err);
            setUploading(false);
            setUploadProgress(0);
            setPickupKey("Error uploading file");
        }
    };

    // Handle manual file select
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            setPickupKey(null);
            setFileExt(null);
            setUploadProgress(0);

            const file = e.target.files[0];
            // Store file extension
            const extMatch = file.name.match(/\.([a-zA-Z0-9]+)$/);
            setFileExt(extMatch ? extMatch[1] : "");
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/deaddrop", true);
                xhr.setRequestHeader("Content-Type", file.type);
                const filename = encodeURIComponent(file.name);
                xhr.setRequestHeader("Content-Disposition", `attachment; filename="${filename}"`);

                xhr.upload.onprogress = (event) => {
                    if (event.lengthComputable) {
                        const percent = Math.round((event.loaded / event.total) * 100);
                        setUploadProgress(percent);
                    }
                };

                xhr.onload = () => {
                    setUploading(false);
                    setUploadProgress(0);
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        setPickupKey(data.id);
                    } else {
                        setPickupKey("Error uploading file");
                    }
                };

                xhr.onerror = () => {
                    setUploading(false);
                    setUploadProgress(0);
                    setPickupKey("Error uploading file");
                };
                xhr.send(file);

            } catch (err) {
                setUploading(false);
                setUploadProgress(0);
                setPickupKey("Error uploading file");
            }
        }
    };

    // Handle download
    const handleDownload = async () => {
        setDownloadError(null);
        try {
            const res = await fetch(`/deaddrop/${downloadKey}`);
            if (!res.ok) throw new Error("Download failed");
            const blob = await res.blob();
            // Try to get filename from Content-Disposition
            let filename = "downloaded_file";
            const disposition = res.headers.get("Content-Disposition");
            if (disposition) {
                const match = disposition.match(/filename="?([^"]+)"?/);
                if (match) filename = decodeURIComponent(match[1]);
            }
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            setDownloadError("Failed to download file. Check your pickup key.");
        }
    };

    return (
        <div className="fire-share-root">
            <h1 className="fire-share-title">Deaddrop</h1>
            <div
                className={`drop-area${dragActive ? " drag-active" : ""}`}
                onDragOver={(e) => {
                    e.preventDefault();
                    setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                tabIndex={0}
                role="button"
                aria-label="Drop file here or click to select"
            >
                <input
                    type="file"
                    style={{ display: "none" }}
                    ref={fileInputRef}
                    onChange={handleFileChange}
                />
                {uploading ? (
                    <span>
                        Uploading... {uploadProgress > 0 ? (
                            <span>
                                <progress value={uploadProgress} max={100} style={{ width: "120px", verticalAlign: "middle" }} />
                                {" "}{uploadProgress}%
                            </span>
                        ) : null}
                    </span>
                ) : (
                    <span>
                        <b>Drop here to upload</b>
                        <br />
                        <span className="or-text">or click to select a file</span>
                    </span>
                )}
            </div>
            {pickupKey && (
                <div className="pickup-key" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span>Pickup Key:</span>
                    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <code>{pickupKey}</code>
                        <div
                            style={{ display: "flex", position: "relative" }}
                        >
                            {copiedId && 
                                <span style={{ 
                                        color: "#4caf50", 
                                        fontSize: "0.9em",
                                        position: "absolute",
                                        top: "-30px",
                                        left: "50%",
                                        transform: "translateX(-50%)",
                                    }}>
                                    Copied!
                                </span>
                            }
                            <button
                                title="Copy ID"
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                onClick={async () => {
                                    if (pickupKey) {
                                        await navigator.clipboard.writeText(pickupKey);
                                        setCopiedId(true);
                                        setTimeout(() => setCopiedId(false), 1000);
                                    }
                                }}
                                aria-label="Copy ID"
                            >
                                {/* Clipboard Icon */}
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <rect x="6" y="2" width="8" height="2" rx="1" fill="#555"/>
                                    <rect x="4" y="4" width="12" height="14" rx="2" stroke="#555" strokeWidth="2" fill="none"/>
                                </svg>
                            </button>
                        </div>
                        <div
                            style={{ display: "flex", position: "relative" }}
                        >
                            {copiedLink && 
                                <span style={{ 
                                    color: "#4caf50",
                                    fontSize: "0.9em",
                                    position: "absolute",
                                    top: "-30px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                }}>Copied!</span>}
                            <button
                                title="Copy Link"
                                style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
                                onClick={async () => {
                                    if (pickupKey && fileExt) {
                                        const link = `${window.location.origin}/deaddrop/${pickupKey}.${fileExt}`;
                                        await navigator.clipboard.writeText(link);
                                        setCopiedLink(true);
                                        setTimeout(() => setCopiedLink(false), 1000);
                                    }
                                }}
                                aria-label="Copy Link"
                                disabled={!fileExt}
                            >
                                {/* Link Icon */}
                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                                    <path d="M7.5 12.5L12.5 7.5" stroke="#555" strokeWidth="2" strokeLinecap="round"/>
                                    <rect x="2" y="11" width="7" height="7" rx="3.5" stroke="#555" strokeWidth="2"/>
                                    <rect x="11" y="2" width="7" height="7" rx="3.5" stroke="#555" strokeWidth="2"/>
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
            )}
            <div className="download-section">
                <span>Or enter pickup key to download:</span>
                <div className="download-input-row">
                    <input
                        type="text"
                        placeholder="Enter pickup key"
                        value={downloadKey}
                        onChange={(e) => setDownloadKey(e.target.value)}
                        className="download-input"
                    />
                    <button
                        onClick={handleDownload}
                        className="download-btn"
                        disabled={!downloadKey}
                    >
                        Download
                    </button>
                </div>
                {downloadError && <div className="error-msg">{downloadError}</div>}
            </div>
        </div>
    );
}

export default App;
