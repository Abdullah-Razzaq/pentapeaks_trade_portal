/* eslint-disable @typescript-eslint/no-require-imports */
const fs = require('fs');
const path = require('path');

const filesToUpdate = [
  'src/components/DashboardHeader.tsx',
  'src/app/dashboard/layout.tsx',
  'src/app/dashboard/page.tsx',
  'src/components/LandingPage.tsx',
  'src/components/AdminUsersPanel.tsx',
  'src/app/login/LoginClient.tsx',
  'src/app/signup/SignupClient.tsx',
  'src/app/forgot-password/page.tsx',
];

const replacements = [
  { search: /bg-slate-950/g, replace: 'bg-gray-50' },
  { search: /bg-\[\#0B0F19\]/g, replace: 'bg-gray-50' },
  
  { search: /text-slate-100/g, replace: 'text-gray-900' },
  { search: /text-white/g, replace: 'text-gray-900' },
  
  { search: /text-slate-400/g, replace: 'text-gray-600' },
  { search: /text-slate-300/g, replace: 'text-gray-700' },
  { search: /text-slate-500/g, replace: 'text-gray-500' },
  
  { search: /border-slate-800/g, replace: 'border-gray-200' },
  { search: /border-slate-700/g, replace: 'border-gray-300' },
  
  { search: /bg-slate-900/g, replace: 'bg-white' },
  { search: /bg-slate-800/g, replace: 'bg-gray-100' },
  
  // Custom auth modals updates
  { search: /bg-white\/40/g, replace: 'bg-slate-900/20' }, // from previous if any
  { search: /bg-white\/90/g, replace: 'bg-white' }, // clean up
  { search: /bg-white\/80/g, replace: 'bg-white' }, // clean up
];

filesToUpdate.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Auth modal overlay specific overrides
    if (file.includes('LoginClient') || file.includes('SignupClient') || file.includes('forgot-password')) {
      content = content.replace(/bg-slate-900\/40/g, 'bg-slate-900/20');
      content = content.replace(/bg-white\/90/g, 'bg-white border border-gray-200');
    }

    replacements.forEach(rep => {
      content = content.replace(rep.search, rep.replace);
    });
    
    // some manual fixes for contrast after blind replace
    if (file.includes('DashboardHeader')) {
      // Fix active nav link colors if they became weird
      content = content.replace(/text-gray-900 hover:text-amber-500/g, 'text-gray-700 hover:text-gray-900');
    }

    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Updated ${file}`);
  } else {
    console.log(`File not found: ${file}`);
  }
});
