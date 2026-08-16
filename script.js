const fs = require('fs');
let code = fs.readFileSync('src/components/CompanyExplorer.tsx', 'utf8');

// 1. Wrapper and Table
code = code.replace(
  'className="ledger-table-wrapper w-full overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm scrollbar-thin bg-white print:border-gray-300 print:shadow-none"',
  'className="ledger-table-wrapper w-full overflow-hidden rounded-xl border border-slate-200/80 shadow-sm bg-white print:border-gray-300 print:shadow-none"'
);

code = code.replace(
  'className="ledger-table ledger-table-scroll max-md:!table max-md:!border-separate max-md:!border-spacing-0 text-left text-sm print:text-xs"',
  'className="ledger-table ledger-table-scroll max-md:!table max-md:!border-separate max-md:!border-spacing-0 text-left text-sm print:text-xs w-full table-fixed"'
);

// 2. Remove min-w classes
code = code.replace(/min-w-\[260px\] /g, '');
code = code.replace(/min-w-\[400px\] /g, '');

// 3. Header widths and classes
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap max-md:!hidden">Date</th>', '<th className="w-[9%] px-1.5 py-3 truncate max-md:!hidden">Date</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] hidden max-md:!table-cell">Supplier (Exporter)</th>', '<th className="w-[15%] px-1.5 py-3 truncate max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] hidden max-md:!table-cell">Supplier (Exporter)</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap hidden max-md:!table-cell">Date</th>', '<th className="w-[9%] px-1.5 py-3 truncate hidden max-md:!table-cell">Date</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap">Buyer (Importer)</th>', '<th className="w-[15%] px-1.5 py-3 truncate">Buyer (Importer)</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap">Destination</th>', '<th className="w-[12%] px-1.5 py-3 truncate">Destination</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap max-md:!hidden">Supplier (Exporter)</th>', '<th className="w-[15%] px-1.5 py-3 truncate max-md:!hidden">Supplier (Exporter)</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap">HS Code (PCT)</th>', '<th className="w-[8%] px-1.5 py-3 truncate">HS Code (PCT)</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap">Description</th>', '<th className="w-[23%] px-1.5 py-3 truncate">Description</th>');
code = code.replace('<th className="px-2.5 py-3 whitespace-nowrap ledger-col-numeric">Quantity & Unit</th>', '<th className="w-[8%] px-1.5 py-3 truncate ledger-col-numeric">Quantity & Unit</th>');
code = code.replace('className={`px-2.5 py-3 whitespace-nowrap ledger-col-numeric ${isSortingDisabled ? \'\' : \'cursor-pointer transition-colors group print:hover:bg-transparent\'}`', 'className={`w-[10%] px-1.5 py-3 truncate ledger-col-numeric ${isSortingDisabled ? \'\' : \'cursor-pointer transition-colors group print:hover:bg-transparent\'}`');

// For NTN column in Supplier view (admin only)
code = code.replace('{userRole === "admin" && <th className="px-2.5 py-3 whitespace-nowrap">NTN</th>}', '{userRole === "admin" && <th className="px-1.5 py-3 truncate w-[8%]">NTN</th>}');


// Update td classes globally (px-2.5 to px-1.5, remove whitespace-nowrap where appropriate, add truncate for company names)
code = code.replace(/<td className="px-2\.5/g, '<td className="px-1.5');
code = code.replace(/<th className="px-2\.5/g, '<th className="px-1.5');

// For Date (replace whitespace-nowrap with truncate)
code = code.replace(/text-gray-500 whitespace-nowrap text-xs/g, 'text-gray-500 truncate text-xs');
code = code.replace(/font-medium text-gray-900 text-right whitespace-nowrap/g, 'font-medium text-gray-900 text-right truncate');
code = code.replace(/whitespace-nowrap ledger-col-numeric/g, 'truncate ledger-col-numeric');

// Update company names and counterparty to have title and truncate
// ledger-entity-primary
code = code.replace(/<td className="px-1\.5 py-3 ledger-entity-primary">{row\.company}<\/td>/g, '<td className="px-1.5 py-3 ledger-entity-primary truncate" title={row.company || ""}>{row.company}</td>');
code = code.replace(/<td className="px-1\.5 py-3 ledger-entity-primary hidden max-md:!table-cell max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-\[2px_0_5px_-2px_rgba\(0,0,0,0\.1\)\]">{row\.company}<\/td>/g, '<td className="px-1.5 py-3 ledger-entity-primary truncate hidden max-md:!table-cell max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={row.company || ""}>{row.company}</td>');
code = code.replace(/<td className="px-1\.5 py-3 ledger-entity-primary max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-\[2px_0_5px_-2px_rgba\(0,0,0,0\.1\)\]">{row\.company}<\/td>/g, '<td className="px-1.5 py-3 ledger-entity-primary truncate max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={row.company || ""}>{row.company}</td>');
code = code.replace(/<td className="px-1\.5 py-3 max-md:!hidden ledger-entity-primary">{row\.company}<\/td>/g, '<td className="px-1.5 py-3 max-md:!hidden ledger-entity-primary truncate" title={row.company || ""}>{row.company}</td>');

// ledger-entity-secondary
code = code.replace(/<td className="px-1\.5 py-3 ledger-entity-secondary">{row\.counterparty \?\? "—"}<\/td>/g, '<td className="px-1.5 py-3 ledger-entity-secondary truncate" title={row.counterparty || ""}>{row.counterparty ?? "—"}</td>');
code = code.replace(/<td className="px-1\.5 py-3 max-md:!hidden ledger-entity-secondary">{row\.counterparty \?\? "—"}<\/td>/g, '<td className="px-1.5 py-3 max-md:!hidden ledger-entity-secondary truncate" title={row.counterparty || ""}>{row.counterparty ?? "—"}</td>');
code = code.replace(/<td className="px-1\.5 py-3 ledger-entity-secondary hidden max-md:!table-cell max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-\[2px_0_5px_-2px_rgba\(0,0,0,0\.1\)\]">{row\.counterparty \?\? "—"}<\/td>/g, '<td className="px-1.5 py-3 ledger-entity-secondary truncate hidden max-md:!table-cell max-md:sticky max-md:left-0 max-md:z-10 max-md:bg-white max-md:shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]" title={row.counterparty || ""}>{row.counterparty ?? "—"}</td>');

// country
code = code.replace(/<td className="px-1\.5 py-3">\n\s*\{row\.country \?/g, '<td className="px-1.5 py-3 truncate">\n                        {row.country ?');


fs.writeFileSync('src/components/CompanyExplorer.tsx', code);
console.log("Done");
