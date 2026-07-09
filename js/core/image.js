// Compressão de imagem no cliente (módulo ES). Portado de admin-common.js sem
// mudar o comportamento — apenas passa a ser `export`. Redimensiona para no
// máximo `maxDim` e recomprime em WebP (ou JPEG quando o navegador não suportar)
// na qualidade dada. Poupa o admin de redimensionar à mão e economiza o Storage
// do free tier. Só mexe em jpeg/png/webp; outros tipos (e falhas de canvas)
// voltam intactos. Mantém o original se ele já for menor que o resultado.
// Retorna um File.
export async function compressImage(file, opts) {
    opts = opts || {};
    var maxDim  = opts.maxDim  || 1600;
    var quality = opts.quality || 0.82;
    if (!/^image\/(jpe?g|png|webp)$/i.test(file.type)) return file;

    var dataUrl = await new Promise(function(res, rej) {
        var r = new FileReader();
        r.onload = function() { res(r.result); };
        r.onerror = function() { rej(new Error('Falha ao ler a imagem.')); };
        r.readAsDataURL(file);
    });
    var img = await new Promise(function(res, rej) {
        var im = new Image();
        im.onload  = function() { res(im); };
        im.onerror = function() { rej(new Error('Imagem inválida.')); };
        im.src = dataUrl;
    });

    var scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    var cw = Math.round(img.naturalWidth  * scale);
    var ch = Math.round(img.naturalHeight * scale);
    var canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    canvas.getContext('2d').drawImage(img, 0, 0, cw, ch);

    // Tenta WebP; navegadores sem suporte devolvem outro tipo → cai para JPEG.
    var type = 'image/webp';
    var blob = await new Promise(function(res) { canvas.toBlob(res, type, quality); });
    if (!blob || blob.type !== type) {
        type = 'image/jpeg';
        blob = await new Promise(function(res) { canvas.toBlob(res, type, quality); });
    }
    if (!blob || blob.size >= file.size) return file;   // não compensou: fica o original

    var ext  = type === 'image/webp' ? 'webp' : 'jpg';
    var base = (file.name || 'imagem').replace(/\.[^.]+$/, '');
    return new File([blob], base + '.' + ext, { type: type });
}
