/* eslint-disable @next/next/no-img-element */
"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Download, Calculator, Building2, Anchor, Box, Lock } from "lucide-react";

const numberToWords = (num: number): string => {
  if (num === 0) return 'zero';
  const a = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen', 'eighteen', 'nineteen'];
  const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  const convert = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? '-' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' hundred' + (n % 100 !== 0 ? ' and ' + convert(n % 100) : '');
    if (n < 1000000) return convert(Math.floor(n / 1000)) + ' thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
    if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
    return String(n);
  };

  const integerPart = Math.floor(num);
  const cents = Math.round((num - integerPart) * 100);

  let result = convert(integerPart);
  if (cents > 0) {
    result += ` and ${convert(cents)} cents`;
  }

  return result;
};

export default function InvoiceGenerator() {
  const [tradeTerm, setTradeTerm] = useState<"FOB" | "CFR" | "CIF">("FOB");
  const [currency, setCurrency] = useState("USD");
  const [docType, setDocType] = useState<"Commercial Invoice" | "Proforma Invoice" | "Quotation" | "Packing List">("Commercial Invoice");

  const [user, setUser] = useState<{ role?: string; plan_type?: string } | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoadingUser(false);
      })
      .catch(() => setLoadingUser(false));
  }, []);

  // Trade Logistics
  const [logistics, setLogistics] = useState({
    invoiceNo: "",
    date: "",
    paymentTerms: "100% Advance",
    origin: "Pakistan",
    hsCodeGlobal: "0207.1200",
    pol: "Karachi, Pakistan",
    pod: "Jebel Ali, UAE",
    vessel: "",
    containerNo: "",
    blNo: ""
  });

  const [seller, setSeller] = useState({
    name: "",
    logoUrl: "",
    signatureUrl: "",
    taxId: "",
    address: "",
    phone: "",
    email: "",
    bankDetails: ""
  });

  const [buyer, setBuyer] = useState({
    name: "",
    country: "",
    taxId: "",
    address: "",
    contact: "",
    email: ""
  });

  // Line Items
  const [items, setItems] = useState([
    { id: 1, itemCode: "001", description: "Example Product", hsCode: "0000.0000", packSize: 1, quantity: 10, unit: "PCS", unitPrice: 100, peBagWeight: 0, cartonWeight: 0, packetsPerCarton: 0, productionDate: "", bestBeforeDate: "", cartons: 0, packets: 0 }
  ]);

  // Pricing Modifiers
  const [handlingFee] = useState(250);
  const [freightCharge] = useState(1200);
  const [insurance] = useState({ manual: false, amount: 0, percentage: 1.1 }); // 110% of CIF standard
  const [discount] = useState(0);
  const [advancePayment] = useState(0);

  // Pallet Configuration for Packing List
  const [palletConfig, setPalletConfig] = useState({
    weightPerPallet: 17,
    totalPallets: 18
  });

  const invoiceRef = useRef<HTMLDivElement>(null);

  // Initialize randomized/date-based fields after mount to prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      setLogistics(prev => ({
        ...prev,
        invoiceNo: `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        date: new Date().toISOString().split("T")[0]
      }));
    }, 0);
    return () => clearTimeout(timer);
  }, []);



  // Calculate totals on the fly (derived state)
  const itemsSum = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
  const fobTotal = itemsSum + handlingFee;
  const cfrTotal = fobTotal + freightCharge;

  // Insurance calculation: if CIF, typically insurance is calculated on CFR + 10% (1.1) or manually entered
  let insuranceCalculated = 0;
  if (insurance.manual) {
    insuranceCalculated = insurance.amount;
  } else {
    // Basic 1% of 110% of CFR value rule of thumb
    insuranceCalculated = (cfrTotal * 1.1) * (insurance.percentage / 100);
  }

  const cifTotal = cfrTotal + insuranceCalculated;

  let grandTotal = 0;
  if (tradeTerm === "FOB") grandTotal = fobTotal;
  if (tradeTerm === "CFR") grandTotal = cfrTotal;
  if (tradeTerm === "CIF") grandTotal = cifTotal;

  const finalTotal = grandTotal - discount;
  const netBalance = finalTotal - advancePayment;

  const totals = {
    itemsSum,
    fobTotal,
    cfrTotal,
    cifTotal,
    grandTotal: finalTotal,
    netBalance,
    insuranceCalculated
  };


  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSeller(prev => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSeller(prev => ({ ...prev, signatureUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addItem = () => {
    setItems([...items, { id: Date.now(), itemCode: "", description: "", hsCode: "", packSize: 0, quantity: 1, unit: "MT", unitPrice: 0, peBagWeight: 0, cartonWeight: 0, packetsPerCarton: 0, productionDate: "", bestBeforeDate: "", cartons: 0, packets: 0 }]);
  };

  const removeItem = (id: number) => {
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id: number, field: string, value: string | number) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const exportPDF = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: currency }).format(val);
  };

  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'PKR': return 'Rs';
      case 'AED': return 'د.إ';
      case 'CNY': return '¥';
      default: return '$';
    }
  };

  const showPrices = docType !== "Packing List";

  if (loadingUser) return null;

  if (user?.role !== 'admin' && user?.plan_type !== 'pro' && user?.plan_type !== 'premium') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-6">
          <Lock className="w-8 h-8 text-amber-600"/>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Pro Feature Only</h2>
        <p className="text-gray-600 max-w-md mb-8">
          The Document Builder is available exclusively to Pro and Premium subscribers.
        </p>
        <button className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition-colors shadow-sm">
          Upgrade to Pro to unlock
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-4 md:p-8 print:p-0 text-gray-900 pb-20 print:pb-0">
      <style dangerouslySetInnerHTML={{
        __html: `
        @media print {
          @page { size: A4; margin: 0; }
          body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
        }
      `}} />
      <div className="max-w-7xl mx-auto space-y-6 print:max-w-none print:m-0 print:p-0">

        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="text-blue-600" /> Document Builder</h1>
            <p className="text-gray-500 text-sm mt-1">Configure parameters and generate export-grade PDFs.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
            <select
              className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-medium"
              value={docType}
              onChange={e => setDocType(e.target.value as "Commercial Invoice" | "Proforma Invoice" | "Quotation" | "Packing List")}
            >
              <option value="Commercial Invoice">Commercial Invoice</option>
              <option value="Proforma Invoice">Proforma Invoice</option>
              <option value="Quotation">Quotation</option>
              <option value="Packing List">Packing List</option>
            </select>
            <select
              className="bg-gray-50 border border-gray-200 text-gray-700 py-2 px-4 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              value={currency}
              onChange={e => setCurrency(e.target.value)}
            >
              <option value="USD">USD ($)</option>
              <option value="EUR">EUR (€)</option>
              <option value="PKR">PKR (Rs)</option>
              <option value="AED">AED (د.إ)</option>
              <option value="CNY">CNY (¥)</option>
            </select>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-1">
              {["FOB", "CFR", "CIF"].map(term => (
                <button
                  key={term}
                  onClick={() => setTradeTerm(term as "FOB" | "CFR" | "CIF")}
                  className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${tradeTerm === term ? 'bg-white shadow-sm text-blue-700 border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {term}
                </button>
              ))}
            </div>
            <button
              onClick={exportPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-5 rounded-lg flex items-center gap-2 font-medium transition-colors shadow-sm disabled:opacity-70"
            >
              <Download size={18} /> Export PDF
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block">
          {/* Configuration Sidebar */}
          <div className="lg:col-span-4 space-y-6 print:hidden">

            {/* Logistics */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Anchor size={18} className="text-gray-500" /> Logistics Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Document No.</label>
                    <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.invoiceNo} onChange={e => setLogistics({ ...logistics, invoiceNo: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input type="date" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.date} onChange={e => setLogistics({ ...logistics, date: e.target.value })} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Origin</label>
                    <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.origin} onChange={e => setLogistics({ ...logistics, origin: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">HS Code (Global)</label>
                    <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.hsCodeGlobal} onChange={e => setLogistics({ ...logistics, hsCodeGlobal: e.target.value })} />
                  </div>
                </div>
                {docType !== 'Packing List' && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Payment Terms</label>
                    <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.paymentTerms} onChange={e => setLogistics({ ...logistics, paymentTerms: e.target.value })} />
                  </div>
                )}
                {docType !== 'Quotation' && (
                  <>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Port of Loading (POL)</label>
                      <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.pol} onChange={e => setLogistics({ ...logistics, pol: e.target.value })} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Port of Discharge (POD)</label>
                      <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.pod} onChange={e => setLogistics({ ...logistics, pod: e.target.value })} />
                    </div>
                  </>
                )}
                {(docType === 'Commercial Invoice' || docType === 'Packing List') && (
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Vessel / Flight</label>
                    <input placeholder="e.g. MSC REEF V.123" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.vessel} onChange={e => setLogistics({ ...logistics, vessel: e.target.value })} />
                  </div>
                )}
              </div>
            </div>

            {/* Buyer & Seller */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Building2 size={18} className="text-gray-500" /> Party Details</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Seller</span>
                  <div className="mb-1">
                    <input placeholder="Company Name" className="w-full text-sm bg-transparent font-medium outline-none border-b border-gray-200" value={seller.name} onChange={e => setSeller({ ...seller, name: e.target.value })} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Custom Logo:</label>
                    <input type="file" accept="image/*" className="text-xs w-full text-gray-600 bg-transparent outline-none" onChange={handleLogoUpload} />
                  </div>
                  <div className="flex items-center gap-2 mb-1">
                    <label className="text-xs text-gray-500 whitespace-nowrap">Signature Stamp:</label>
                    <input type="file" accept="image/*" className="text-xs w-full text-gray-600 bg-transparent outline-none" onChange={handleSignatureUpload} />
                  </div>
                  <input placeholder="Tax ID / NTN" className="w-full text-xs text-gray-600 bg-transparent outline-none mb-1" value={seller.taxId} onChange={e => setSeller({ ...seller, taxId: e.target.value })} />
                  <div className="flex gap-2 mb-1">
                    <input placeholder="Phone" className="w-1/2 text-xs text-gray-600 bg-transparent outline-none border-b border-gray-200" value={seller.phone} onChange={e => setSeller({ ...seller, phone: e.target.value })} />
                    <input placeholder="Email" className="w-1/2 text-xs text-gray-600 bg-transparent outline-none border-b border-gray-200" value={seller.email} onChange={e => setSeller({ ...seller, email: e.target.value })} />
                  </div>
                  <textarea placeholder="Address" rows={2} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" value={seller.address} onChange={e => setSeller({ ...seller, address: e.target.value })} />
                  {docType === 'Proforma Invoice' && (
                    <textarea placeholder="Bank Details for Wire Transfer" rows={3} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none mt-1" value={seller.bankDetails} onChange={e => setSeller({ ...seller, bankDetails: e.target.value })} />
                  )}
                </div>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Buyer (Consignee)</span>
                  <input placeholder="Company Name" className="w-full text-sm bg-transparent font-medium outline-none mb-1" value={buyer.name} onChange={e => setBuyer({ ...buyer, name: e.target.value })} />
                  <input placeholder="Country" className="w-full text-xs text-gray-600 bg-transparent outline-none mb-1" value={buyer.country} onChange={e => setBuyer({ ...buyer, country: e.target.value })} />
                  <input placeholder="Tax ID / VAT" className="w-full text-xs text-gray-600 bg-transparent outline-none mb-1" value={buyer.taxId} onChange={e => setBuyer({ ...buyer, taxId: e.target.value })} />
                  <div className="flex gap-2 mb-1">
                    <input placeholder="Contact" className="w-1/2 text-xs text-gray-600 bg-transparent outline-none border-b border-gray-200" value={buyer.contact} onChange={e => setBuyer({ ...buyer, contact: e.target.value })} />
                    <input placeholder="Email" className="w-1/2 text-xs text-gray-600 bg-transparent outline-none border-b border-gray-200" value={buyer.email} onChange={e => setBuyer({ ...buyer, email: e.target.value })} />
                  </div>
                  <textarea placeholder="Address" rows={2} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" value={buyer.address} onChange={e => setBuyer({ ...buyer, address: e.target.value })} />
                </div>
              </div>
            </div>

            {docType === 'Packing List' && (
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Box size={18} className="text-gray-500" /> Pallet Configuration</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Weight per Pallet (kg)</label>
                      <input type="number" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={palletConfig.weightPerPallet} onChange={e => setPalletConfig({...palletConfig, weightPerPallet: Number(e.target.value)})} />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-1 block">Total Pallets</label>
                      <input type="number" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={palletConfig.totalPallets} onChange={e => setPalletConfig({...palletConfig, totalPallets: Number(e.target.value)})} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>

          {/* Interactive Preview & Line Items */}
          <div className="lg:col-span-8 space-y-6 print:col-span-12 print:space-y-0">

            {/* Table Builder */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Box size={18} className="text-gray-500" /> Document Items</h3>
                <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"><Plus size={16} /> Add Item</button>
              </div>

              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="pb-3 font-medium">Description & HS Code</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium px-2">Unit</th>
                    {showPrices && <th className="pb-3 font-medium text-right">Unit Price</th>}
                    {showPrices && <th className="pb-3 font-medium text-right">Total</th>}
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="py-3">
                        <div className="mb-2">
                          <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">Item Description</label>
                          <input placeholder="Enter product name..." className="w-full text-sm font-semibold text-gray-800 outline-none bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 pb-1 transition-colors" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        </div>
                        <div className="flex gap-4 mt-2">
                          <div className="w-1/2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">HS Code</label>
                            <input placeholder="e.g. 2501.0010" className="w-full text-xs text-gray-600 outline-none bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 pb-1 transition-colors" value={item.hsCode} onChange={e => updateItem(item.id, 'hsCode', e.target.value)} />
                          </div>
                          <div className="w-1/2">
                            <label className="text-[10px] text-gray-400 font-bold uppercase block mb-0.5">SKU / Item Code</label>
                            <input placeholder="e.g. 01219" className="w-full text-xs text-gray-600 outline-none bg-transparent border-b border-dashed border-gray-200 focus:border-blue-400 pb-1 transition-colors" value={item.itemCode || ''} onChange={e => updateItem(item.id, 'itemCode', e.target.value)} />
                          </div>
                        </div>
                        {docType === 'Packing List' && (
                          <div className="grid grid-cols-4 gap-2 mt-3 bg-gray-50/50 p-2.5 rounded-lg border border-gray-100">
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Pack Size</label><input type="number" placeholder="0.0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.packSize || ''} onChange={e => updateItem(item.id, 'packSize', Number(e.target.value))} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">PE Bag Wt</label><input type="number" placeholder="0.0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.peBagWeight || ''} onChange={e => updateItem(item.id, 'peBagWeight', Number(e.target.value))} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Carton Wt</label><input type="number" placeholder="0.0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.cartonWeight || ''} onChange={e => updateItem(item.id, 'cartonWeight', Number(e.target.value))} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Pkts/Carton</label><input type="number" placeholder="0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.packetsPerCarton || ''} onChange={e => updateItem(item.id, 'packetsPerCarton', Number(e.target.value))} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Prod. Date</label><input type="text" placeholder="DD-MM-YY" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.productionDate || ''} onChange={e => updateItem(item.id, 'productionDate', e.target.value)} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Best Before</label><input type="text" placeholder="DD-MM-YY" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.bestBeforeDate || ''} onChange={e => updateItem(item.id, 'bestBeforeDate', e.target.value)} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Cartons</label><input type="number" placeholder="0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.cartons || ''} onChange={e => updateItem(item.id, 'cartons', Number(e.target.value))} /></div>
                            <div><label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Packets</label><input type="number" placeholder="0" className="w-full text-xs outline-none bg-white border border-gray-200 px-2 py-1.5 rounded focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={item.packets || ''} onChange={e => updateItem(item.id, 'packets', Number(e.target.value))} /></div>
                          </div>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <input type="number" className="w-16 text-right text-sm outline-none bg-transparent border-b border-transparent focus:border-gray-200" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="py-3 px-2">
                        <select className="text-sm text-gray-600 outline-none bg-transparent" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                          <option>MT</option><option>KGS</option><option>PCS</option><option>CBM</option><option>BOX</option>
                        </select>
                      </td>
                      {showPrices && (
                        <td className="py-3 text-right">
                          <input type="number" className="w-20 text-right text-sm outline-none bg-transparent border-b border-transparent focus:border-gray-200" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
                        </td>
                      )}
                      {showPrices && (
                        <td className="py-3 text-right text-sm font-medium text-gray-700">
                          {formatCurrency(item.quantity * item.unitPrice)}
                        </td>
                      )}
                      <td className="py-3 text-right px-2">
                        <button onClick={() => removeItem(item.id)} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* LIVE PDF PREVIEW CANVAS */}
            <div className="bg-gray-200 p-4 md:p-8 rounded-2xl flex justify-center overflow-x-auto shadow-inner print:p-0 print:bg-white print:shadow-none print:overflow-visible print:block">
              {/* PDF Container - Fixed A4 proportions for accurate rendering */}
              <div
                ref={invoiceRef}
                className="bg-white w-[210mm] min-h-[297mm] flex flex-col text-black shrink-0 relative print:w-[210mm] print:min-h-[297mm] print:p-0 border border-gray-200 print:border-none shadow-xl print:shadow-none print:mx-auto"
                style={{ fontFamily: 'Arial, sans-serif' }}
              >
                {/* Inner Padding container */}
                <div className="p-[15mm] flex flex-col h-full flex-1">

                  <div className="flex justify-between items-start mb-4">
                    <div className="w-64 h-24 flex items-center justify-start">
                      {seller.logoUrl && (
                        <img src={seller.logoUrl} alt="Logo" className="max-w-full h-auto max-h-24 object-contain" />
                      )}
                    </div>
                    <div className="text-right flex-1 ml-4 pt-4">
                      <h2 className="italic font-bold text-gray-800 text-xl uppercase tracking-wide">{docType}</h2>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mb-6 relative">
                    <div className="w-full border-t-[4px] border-blue-600 mt-2"></div>
                  </div>

                  {docType === 'Commercial Invoice' || docType === 'Quotation' || docType === 'Proforma Invoice' ? (
                    <>
                      <div className="mb-4">
                        <p className="font-bold text-[12px] mb-1">INVOICE DETAILS:</p>
                        <table className="w-72 text-[11px]">
                          <tbody>
                            <tr><td className="w-28 font-bold">Invoice Number:</td><td>{logistics.invoiceNo}</td></tr>
                            <tr><td className="font-bold">Invoice Date:</td><td>{logistics.date}</td></tr>
                            <tr><td className="font-bold">Delivery Term:</td><td>{tradeTerm}</td></tr>
                            <tr><td className="font-bold">H.S Code:</td><td>{logistics.hsCodeGlobal}</td></tr>
                            <tr><td className="font-bold">Origin:</td><td>{logistics.origin}</td></tr>
                            <tr><td className="font-bold">Payment Term:</td><td>{logistics.paymentTerms}</td></tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-4 text-[11px]">
                        <table className="w-full">
                          <tbody>
                            <tr><td className="w-28 font-bold align-top">Seller:</td><td>{seller.name}</td></tr>
                            <tr><td className="font-bold align-top">Address:</td><td>{seller.address}</td></tr>
                            <tr><td className="font-bold align-top">Phone:</td><td>{seller.phone}</td></tr>
                            <tr><td className="font-bold align-top">Email:</td><td>{seller.email}</td></tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-6 text-[11px]">
                        <table className="w-full">
                          <tbody>
                            <tr><td className="w-28 font-bold align-top">Consignee:</td><td></td></tr>
                            <tr><td className="font-bold align-top">Company Name:</td><td>{buyer.name}</td></tr>
                            <tr><td className="font-bold align-top">Address:</td><td>{buyer.address}</td></tr>
                            <tr><td className="font-bold align-top">Contact:</td><td>{buyer.contact}</td></tr>
                            <tr><td className="font-bold align-top">Email:</td><td>{buyer.email}</td></tr>
                          </tbody>
                        </table>
                      </div>

                      <table className="w-full border-collapse border border-black text-[11px] text-center mb-0">
                        <thead>
                          <tr className="border-b border-black font-bold">
                            <th className="border-r border-black py-2 px-2 w-24">ITEM CODE</th>
                            <th className="border-r border-black py-2 px-2">ITEM NAME</th>
                            <th className="border-r border-black py-2 px-2 w-20">Pack Size</th>
                            <th className="border-r border-black py-2 px-2 w-24">Qty ({items[0]?.unit || 'Kg'})</th>
                            <th className="border-r border-black py-2 px-2 w-24">Per {items[0]?.unit || 'Kg'}<br />Price<br />{currency} ({getCurrencySymbol(currency)})</th>
                            <th className="py-2 px-2 w-28">Total Value<br />{currency} ({getCurrencySymbol(currency)})</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => (
                            <tr key={idx} className="border-b border-black">
                              <td className="border-r border-black py-3 px-2">{item.itemCode || "-"}</td>
                              <td className="border-r border-black py-3 px-2 text-left">{item.description}</td>
                              <td className="border-r border-black py-3 px-2">{item.packSize ? item.packSize.toFixed(2) : "-"}</td>
                              <td className="border-r border-black py-3 px-2">{item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              <td className="border-r border-black py-3 px-2">{item.unitPrice.toFixed(2)}</td>
                              <td className="py-3 px-2">{(item.quantity * item.unitPrice).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                          <tr className="border-b border-black font-bold">
                            <td colSpan={2} className="border-r border-black py-2 px-2 text-left">Net Quantity</td>
                            <td className="border-r border-black py-2 px-2"></td>
                            <td className="border-r border-black py-2 px-2">{items.reduce((acc, it) => acc + it.quantity, 0).toLocaleString()}</td>
                            <td className="border-r border-black py-2 px-2"></td>
                            <td className="py-2 px-2"></td>
                          </tr>
                          <tr className="border-b border-black font-bold">
                            <td colSpan={5} className="border-r border-black py-2 px-2 text-left">Total Value {tradeTerm}</td>
                            <td className="py-2 px-2">{totals.grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="border border-t-0 border-black px-2 py-1 text-[11px] font-bold mb-6">
                        Amount In Word: {numberToWords(totals.grandTotal).toUpperCase()}  {currency} ONLY.
                      </div>
                      {docType === 'Proforma Invoice' && seller.bankDetails && (
                        <div className="w-80 text-gray-900 mb-6 mt-2">
                          <p className="font-extrabold text-[13px] mb-1.5 underline uppercase tracking-wide">Bank Details for Wire Transfer:</p>
                          <pre className="font-sans font-bold text-[12px] whitespace-pre-wrap leading-relaxed">{seller.bankDetails}</pre>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div className="mb-6 text-[11px]">
                        <table className="w-64">
                          <tbody>
                            <tr><td className="font-bold py-0.5">Reference No:</td><td>{logistics.invoiceNo}</td></tr>
                            <tr><td className="font-bold py-0.5">Date:</td><td>{logistics.date}</td></tr>
                            <tr><td className="font-bold py-0.5">Origin:</td><td>{logistics.origin}</td></tr>
                            <tr><td className="font-bold py-0.5">Delivery:</td><td>{tradeTerm}</td></tr>
                            <tr><td className="font-bold py-0.5">HS Code:</td><td>{logistics.hsCodeGlobal}</td></tr>
                            <tr><td className="font-bold py-0.5">Payment Terms:</td><td>{logistics.paymentTerms}</td></tr>
                          </tbody>
                        </table>
                      </div>

                      <div className="mb-6 text-[11px]">
                        <p className="font-bold uppercase mb-1">SELLER: {seller.name.toUpperCase()}</p>
                        <p className="font-bold mb-0.5">NTN/SNIC Number: {seller.taxId.replace('NTN: ', '')}</p>
                        <p className="font-bold mb-0.5">Address: {seller.address}</p>
                        <p className="font-bold mb-0.5">Phone: {seller.phone}</p>
                        <p className="font-bold">Email: {seller.email}</p>
                      </div>

                      <div className="mb-6 text-[11px]">
                        <p className="font-bold uppercase mb-1">CONSIGNEE: {buyer.name.toUpperCase()}</p>
                        <p className="font-bold mb-0.5">Address: {buyer.address}</p>
                        <p className="font-bold mb-0.5">Contact: {buyer.contact}</p>
                        <p className="font-bold">Email: {buyer.email}</p>
                      </div>

                      <table className="w-full border-collapse border border-black text-[8px] text-center mb-8">
                        <thead>
                          <tr className="border-b border-black font-bold">
                            <th className="border-r border-black p-1 w-6">Sr. #</th>
                            <th className="border-r border-black p-1">SKU</th>
                            <th className="border-r border-black p-1">Product Name</th>
                            <th className="border-r border-black p-1">Pack<br />Size</th>
                            <th className="border-r border-black p-1">Pe-Bag<br />Weight</th>
                            <th className="border-r border-black p-1">Carton<br />Weight</th>
                            <th className="border-r border-black p-1">Packets<br />per<br />Carton</th>
                            <th className="border-r border-black p-1">Production<br />Date</th>
                            <th className="border-r border-black p-1">Best<br />Before<br />Date</th>
                            <th className="border-r border-black p-1">Cartons</th>
                            <th className="border-r border-black p-1">Packets</th>
                            <th className="border-r border-black p-1">Kgs</th>
                            <th className="border-r border-black p-1">Total PE-<br />Bags<br />Weight</th>
                            <th className="border-r border-black p-1">Total<br />Cartons<br />Weight</th>
                            <th className="p-1">Gross<br />Weight</th>
                          </tr>
                        </thead>
                        <tbody>
                          {items.map((item, idx) => {
                            const totalPeBag = (item.packets || 0) * (item.peBagWeight || 0);
                            const totalCartonWeight = (item.cartons || 0) * (item.cartonWeight || 0);
                            const grossWeight = item.quantity + totalPeBag + totalCartonWeight;
                            return (
                              <tr key={idx} className="border-b border-black">
                                <td className="border-r border-black p-1">{idx + 1}</td>
                                <td className="border-r border-black p-1">{item.itemCode || "-"}</td>
                                <td className="border-r border-black p-1 text-left">{item.description}</td>
                                <td className="border-r border-black p-1">{item.packSize ? item.packSize.toFixed(2) : "-"}</td>
                                <td className="border-r border-black p-1">{item.peBagWeight ? item.peBagWeight.toFixed(2) : "-"}</td>
                                <td className="border-r border-black p-1">{item.cartonWeight ? item.cartonWeight.toFixed(2) : "-"}</td>
                                <td className="border-r border-black p-1">{item.packetsPerCarton || "-"}</td>
                                <td className="border-r border-black p-1">{item.productionDate || "-"}</td>
                                <td className="border-r border-black p-1">{item.bestBeforeDate || "-"}</td>
                                <td className="border-r border-black p-1">{item.cartons ? item.cartons.toFixed(2) : "-"}</td>
                                <td className="border-r border-black p-1">{item.packets ? item.packets.toFixed(2) : "-"}</td>
                                <td className="border-r border-black p-1">{item.quantity.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                                <td className="border-r border-black p-1">{totalPeBag.toFixed(2)}</td>
                                <td className="border-r border-black p-1">{totalCartonWeight.toFixed(2)}</td>
                                <td className="p-1">{grossWeight.toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                              </tr>
                            );
                          })}
                          <tr className="border-b border-black font-bold">
                            <td colSpan={9} className="border-r border-black p-1 text-right">Total</td>
                            <td className="border-r border-black p-1">{items.reduce((a, b) => a + (b.cartons || 0), 0).toFixed(2)}</td>
                            <td className="border-r border-black p-1">{items.reduce((a, b) => a + (b.packets || 0), 0).toFixed(2)}</td>
                            <td className="border-r border-black p-1">{items.reduce((a, b) => a + b.quantity, 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                            <td className="border-r border-black p-1">{items.reduce((a, b) => a + ((b.packets || 0) * (b.peBagWeight || 0)), 0).toFixed(2)}</td>
                            <td className="border-r border-black p-1">{items.reduce((a, b) => a + ((b.cartons || 0) * (b.cartonWeight || 0)), 0).toFixed(2)}</td>
                            <td className="p-1">{items.reduce((a, b) => a + (b.quantity + ((b.packets || 0) * (b.peBagWeight || 0)) + ((b.cartons || 0) * (b.cartonWeight || 0))), 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</td>
                          </tr>
                        </tbody>
                      </table>
                      <div className="flex justify-end text-[9px] mb-6">
                        <table className="w-72 border-collapse border border-black text-right">
                          <tbody>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1.5 font-bold text-center">One Pallet Weight</td>
                              <td className="p-1.5 w-20">{palletConfig.weightPerPallet.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1.5 font-bold text-center">Total Pallets</td>
                              <td className="p-1.5">{palletConfig.totalPallets.toFixed(2)}</td>
                            </tr>
                            <tr className="border-b border-black">
                              <td className="border-r border-black p-1.5 font-bold text-center">Total Pallets Weight</td>
                              <td className="p-1.5">{(palletConfig.weightPerPallet * palletConfig.totalPallets).toFixed(2)}</td>
                            </tr>
                            <tr>
                              <td className="border-r border-black p-1.5 font-bold text-center">Gross Weight Inclusive Pallets</td>
                              <td className="p-1.5 font-bold">
                                {(items.reduce((a, b) => a + (b.quantity + ((b.packets || 0) * (b.peBagWeight || 0)) + ((b.cartons || 0) * (b.cartonWeight || 0))), 0) + (palletConfig.weightPerPallet * palletConfig.totalPallets)).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}

                  {/* Signatures & Footer */}
                  <div className="flex justify-end items-end mt-auto pt-4 relative pb-12">
                    <div className="w-72 z-10 text-center">
                      <p className="text-[12px] font-bold text-left">Thanks & Regards,</p>
                      <div className={`flex justify-center items-center my-1 ${seller.signatureUrl ? 'h-16' : 'h-10'}`}>
                        {seller.signatureUrl && (
                          <img src={seller.signatureUrl} alt="Authorized Signature" className="max-h-full max-w-full object-contain mix-blend-multiply" />
                        )}
                      </div>
                      <div className="border-t border-black pt-1">
                        <p className="text-[11px] font-bold">Authorized Signatory & Stamp</p>
                      </div>
                    </div>
                  </div>

                  {/* Footer Section */}
                  <div className="absolute bottom-6 left-[15mm] right-[15mm]">
                    <div className="w-full h-0.5 bg-gradient-to-r from-blue-900 to-blue-500 mb-2"></div>
                    <div className="text-center text-[10px] text-gray-700">
                      {seller.name && <p className="font-bold text-[11px] text-black mb-1">{seller.name.toUpperCase()}</p>}
                      {seller.address && <p>{seller.address}</p>}
                      {(seller.phone || seller.email) && <p>Phone: {seller.phone || '-'} | Email: {seller.email || '-'}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
