export default function formatLabel(f: File) {
    const ext = f.name.includes('.') ? f.name.split('.').pop() : '';
    return (ext || f.type.split('/')[1] || 'audio').toUpperCase();
}