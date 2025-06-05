import { useRef, useState } from "react";
import "./App.css";

function App() {
    const [pickupKey, setPickupKey] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [downloadKey, setDownloadKey] = useState("");
    const [downloadError, setDownloadError] = useState<string | null>(null);
    const [dragActive, setDragActive] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Handle file drop/upload
    const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setDragActive(false);
        const files = e.dataTransfer.files;
        if (files.length === 0) return;
        setUploading(true);
        setPickupKey(null);

        const file = files[0];
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("POST", "/deaddrop", true);
            xhr.setRequestHeader("Content-Type", file.type);
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const data = JSON.parse(xhr.responseText);
                    setPickupKey(data.id);
                } else {
                    setPickupKey("Error uploading file");
                }
            };

            xhr.onerror = () => {
                setPickupKey("Error uploading file");
            };
            xhr.send(file);

        } catch (err) {
            setPickupKey("Error uploading file");
        }
        setUploading(false);
    };

    // Handle manual file select
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setUploading(true);
            setPickupKey(null);
            const file = e.target.files[0];
            try {
                const xhr = new XMLHttpRequest();
                xhr.open("POST", "/deaddrop", true);
                xhr.setRequestHeader("Content-Type", file.type);
                xhr.onload = () => {
                    if (xhr.status === 200) {
                        const data = JSON.parse(xhr.responseText);
                        setPickupKey(data.id);
                    } else {
                        setPickupKey("Error uploading file");
                    }
                };

                xhr.onerror = () => {
                    setPickupKey("Error uploading file");
                };
                xhr.send(file);

            } catch (err) {
                setPickupKey("Error uploading file");
            }
            setUploading(false);
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
                if (match) filename = match[1];
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
                    <span>Uploading...</span>
                ) : (
                    <span>
                        <b>Drop here to upload</b>
                        <br />
                        <span className="or-text">or click to select a file</span>
                    </span>
                )}
            </div>
            {pickupKey && (
                <div className="pickup-key">
                    <span>Pickup Key:</span>
                    <code>{pickupKey}</code>
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
