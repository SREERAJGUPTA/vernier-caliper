"""Verify the deliverable ZIP, per-file hashes, mandatory contents and Pages base."""
import hashlib, json, sys, zipfile
from pathlib import Path, PurePosixPath

def verify(filename):
    with zipfile.ZipFile(filename) as archive:
        failure=archive.testzip()
        if failure: raise ValueError(f'CRC failed: {failure}')
        names=archive.namelist()
        roots={PurePosixPath(n).parts[0] for n in names if n}
        if len(roots)!=1: raise ValueError('Archive must have one project root')
        root=next(iter(roots))+'/'
        for name in names:
            parts=PurePosixPath(name).parts
            if name.startswith('/') or '..' in parts: raise ValueError('Unsafe archive path')
            if 'node_modules' in parts or '.git' in parts: raise ValueError('Unwanted dependency/cache metadata')
        required=['package.json','package-lock.json','README.md','src/App.tsx','src/domain/scales.ts','src/contact/solver.ts','src/rendering/Scene.tsx','tests/e2e/run.mjs','dist/index.html','dist/sw.js','dist/offline-manifest.json','dist/.nojekyll','.github/workflows/deploy-approved.yml','docs/VALIDATION.md','docs/FEATURE_MATRIX.md','DELIVERY_MANIFEST.json']
        for item in required:
            if root+item not in names: raise ValueError(f'Missing mandatory file: {item}')
        manifest=json.loads(archive.read(root+'DELIVERY_MANIFEST.json'))
        expected={root+name for name in manifest['files']}
        actual={n for n in names if not n.endswith('/') and n!=root+'DELIVERY_MANIFEST.json'}
        if actual!=expected: raise ValueError('Archive inventory differs from delivery manifest')
        for name,entry in manifest['files'].items():
            data=archive.read(root+name)
            if len(data)!=entry['bytes'] or hashlib.sha256(data).hexdigest()!=entry['sha256']:
                raise ValueError(f'Content mismatch: {name}')
        offline=json.loads(archive.read(root+'dist/offline-manifest.json'))
        if offline['base']!='/vernier-caliper/': raise ValueError('Incorrect GitHub Pages base')
        for item in offline['files']:
            rel=item['url'].removeprefix('/vernier-caliper/')
            data=archive.read(root+'dist/'+rel)
            if hashlib.sha256(data).hexdigest()!=item['sha256']: raise ValueError('Offline integrity mismatch')
        html=archive.read(root+'dist/index.html').decode()
        if '/vernier-caliper/assets/' not in html: raise ValueError('Production HTML is not subpath-aware')
        return {'status':'verified','file':Path(filename).name,'files':len(actual)+1,'uncompressed_bytes':sum(i.file_size for i in archive.infolist()),'zip_bytes':Path(filename).stat().st_size,'zip_sha256':hashlib.sha256(Path(filename).read_bytes()).hexdigest(),'offline_files':len(offline['files']),'offline_bytes':offline['bytes'],'build':offline['version']}

if __name__=='__main__':
    if len(sys.argv)!=2: raise SystemExit('Usage: python scripts/verify_archive.py /path/to/Precision-Lab-Rebuilt-GitHub-Pages.zip')
    print(json.dumps(verify(sys.argv[1]),indent=2))
