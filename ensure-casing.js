import fs from 'fs';
import path from 'path';

function ensureCasing() {
  const root = process.cwd();
  console.log('[ensure-casing] Running casing guarantee script...');
  console.log(`[ensure-casing] Root directory: ${root}`);

  // Find actual directory entries in the root
  let items;
  try {
    items = fs.readdirSync(root);
  } catch (err) {
    console.error('[ensure-casing] Failed to read current working directory:', err);
    return;
  }

  // Look for any case-insensitive match for "src" directory
  const srcMatches = items.filter(item => item.toLowerCase() === 'src');
  console.log(`[ensure-casing] Found items matching "src" casing in root:`, srcMatches);

  let actualSrcDirName = 'src';
  // Check if there is an uppercase one like 'Src'
  const uppercaseSrc = srcMatches.find(item => item !== 'src');
  
  if (uppercaseSrc) {
    console.log(`[ensure-casing] Detected differently cased src directory: "${uppercaseSrc}"`);
    // If lowercase "src" doesn't exist on disk, we can create a directory symlink or copy it
    if (!fs.existsSync(path.join(root, 'src'))) {
      try {
        console.log(`[ensure-casing] Copying files from "${uppercaseSrc}" to "src" folder for case alignment...`);
        // We can do a recursive copy or symlink. Direct symlink is fast and handles updates.
        fs.symlinkSync(uppercaseSrc, 'src', 'dir');
        console.log('[ensure-casing] Created directory symlink: src -> ' + uppercaseSrc);
        actualSrcDirName = 'src';
      } catch (err) {
        console.warn(`[ensure-casing] Could not symlink "src", trying recursive copy:`, err.message);
        try {
          fs.mkdirSync('src', { recursive: true });
          copyRecursiveSync(uppercaseSrc, 'src');
          actualSrcDirName = 'src';
          console.log('[ensure-casing] Recursively copied directory successful!');
        } catch (copyErr) {
          console.error('[ensure-casing] Copy also failed:', copyErr.message);
        }
      }
    } else {
      actualSrcDirName = 'src';
    }
  } else {
    // lowercase src exists, but let's check its contents
    if (!fs.existsSync(path.join(root, 'src'))) {
      console.log('[ensure-casing] "src" folder does not exist at all, creating empty one');
      fs.mkdirSync('src', { recursive: true });
    }
  }

  // Now inspect the src folder content (where main.tsx, App.tsx, index.css should be)
  const srcPath = path.join(root, actualSrcDirName);
  if (fs.existsSync(srcPath)) {
    try {
      const srcItems = fs.readdirSync(srcPath);
      console.log(`[ensure-casing] Contents of "${actualSrcDirName}":`, srcItems);
      
      // Let's guarantee lowercase main.tsx
      const mainMatch = srcItems.find(item => item.toLowerCase() === 'main.tsx');
      if (mainMatch && mainMatch !== 'main.tsx') {
        console.log(`[ensure-casing] Found differently cased main file: "${mainMatch}". Creating lowercase alias...`);
        try {
          fs.symlinkSync(mainMatch, path.join(srcPath, 'main.tsx'), 'file');
        } catch (_) {
          try {
            fs.copyFileSync(path.join(srcPath, mainMatch), path.join(srcPath, 'main.tsx'));
            console.log(`[ensure-casing] Copied "${mainMatch}" to "main.tsx" successfully.`);
          } catch (err) {
            console.error('[ensure-casing] Failed to create main.tsx copy/link:', err.message);
          }
        }
      }

      // Let's guarantee lowercase App.tsx
      const appMatch = srcItems.find(item => item.toLowerCase() === 'app.tsx');
      if (appMatch && appMatch !== 'App.tsx') {
        console.log(`[ensure-casing] Found differently cased App file: "${appMatch}". Creating "App.tsx" duplicate...`);
        try {
          fs.copyFileSync(path.join(srcPath, appMatch), path.join(srcPath, 'App.tsx'));
        } catch (err) {
          console.error('[ensure-casing] Failed to copy App.tsx:', err.message);
        }
      }

      // Let's guarantee lowercase index.css
      const cssMatch = srcItems.find(item => item.toLowerCase() === 'index.css');
      if (cssMatch && cssMatch !== 'index.css') {
        console.log(`[ensure-casing] Found differently cased css file: "${cssMatch}". Creating lowercase alias...`);
        try {
          fs.copyFileSync(path.join(srcPath, cssMatch), path.join(srcPath, 'index.css'));
        } catch (err) {
          console.error('[ensure-casing] Failed to copy index.css:', err.message);
        }
      }
    } catch (err) {
      console.error('[ensure-casing] Failed to process src items:', err.message);
    }
  }
}

function copyRecursiveSync(src, dest) {
  const exists = fs.existsSync(src);
  const stats = exists && fs.statSync(src);
  const isDirectory = exists && stats.isDirectory();
  if (isDirectory) {
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest);
    }
    fs.readdirSync(src).forEach((childItem) => {
      copyRecursiveSync(path.join(src, childItem), path.join(dest, childItem));
    });
  } else {
    fs.copyFileSync(src, dest);
  }
}

try {
  ensureCasing();
} catch (globalErr) {
  console.error('[ensure-casing] Global execution failed:', globalErr);
}
