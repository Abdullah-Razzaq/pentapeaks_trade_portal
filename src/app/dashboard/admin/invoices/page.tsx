"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Download, Calculator, Building2, Anchor, CreditCard, Box } from "lucide-react";

export default function InvoiceGenerator() {
  const [tradeTerm, setTradeTerm] = useState<"FOB" | "CFR" | "CIF">("FOB");
  const [currency, setCurrency] = useState("USD");
  
  // Trade Logistics
  const [logistics, setLogistics] = useState({
    invoiceNo: "",
    date: "",
    paymentTerms: "100% LC at sight",
    pol: "Karachi, Pakistan",
    pod: "Jebel Ali, UAE",
    vessel: "",
    containerNo: "",
    blNo: ""
  });

  // Parties
  const [seller, setSeller] = useState({
    name: "Pentapeaks International",
    taxId: "NTN: 1234567-8",
    address: "123 Business Avenue, Karachi, Pakistan",
    bankDetails: "Bank: Standard Chartered\nIBAN: PK35SCBL00001234567890\nSWIFT: SCBLPKKA"
  });

  const [buyer, setBuyer] = useState({
    name: "Global Trade LLC",
    country: "United Arab Emirates",
    taxId: "VAT: 100234567890",
    address: "Dubai Investment Park, PO Box 12345, Dubai"
  });

  // Line Items
  const [items, setItems] = useState([
    { id: 1, description: "Premium Himalayan Pink Salt", hsCode: "2501.0010", quantity: 20, unit: "MT", unitPrice: 150 }
  ]);

  // Pricing Modifiers
  const [handlingFee, setHandlingFee] = useState(250);
  const [freightCharge, setFreightCharge] = useState(1200);
  const [insurance, setInsurance] = useState({ manual: false, amount: 0, percentage: 1.1 }); // 110% of CIF standard
  const [discount, setDiscount] = useState(0);
  const [advancePayment, setAdvancePayment] = useState(0);

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

  const addItem = () => {
    setItems([...items, { id: Date.now(), description: "", hsCode: "", quantity: 1, unit: "MT", unitPrice: 0 }]);
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

  return (
    <div className="min-h-screen bg-gray-50 print:bg-white p-4 md:p-8 print:p-0 text-gray-900 pb-20 print:pb-0">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 print:hidden">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="text-blue-600" /> Commercial Invoice Builder</h1>
            <p className="text-gray-500 text-sm mt-1">Configure parameters and generate export-grade PDFs.</p>
          </div>
          <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Configuration Sidebar */}
          <div className="lg:col-span-4 space-y-6 print:hidden">
            
            {/* Logistics */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Anchor size={18} className="text-gray-500"/> Logistics Details</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Invoice No.</label>
                    <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.invoiceNo} onChange={e => setLogistics({...logistics, invoiceNo: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-1 block">Date</label>
                    <input type="date" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.date} onChange={e => setLogistics({...logistics, date: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Port of Loading (POL)</label>
                  <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.pol} onChange={e => setLogistics({...logistics, pol: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Port of Discharge (POD)</label>
                  <input className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.pod} onChange={e => setLogistics({...logistics, pod: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs text-gray-500 mb-1 block">Vessel / Flight</label>
                  <input placeholder="e.g. MSC REEF V.123" className="w-full text-sm border-b border-gray-200 py-1 outline-none focus:border-blue-500" value={logistics.vessel} onChange={e => setLogistics({...logistics, vessel: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Buyer & Seller */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><Building2 size={18} className="text-gray-500"/> Party Details</h3>
              <div className="space-y-4">
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Seller</span>
                  <input placeholder="Company Name" className="w-full text-sm bg-transparent font-medium outline-none mb-1" value={seller.name} onChange={e => setSeller({...seller, name: e.target.value})} />
                  <textarea placeholder="Address" rows={2} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" value={seller.address} onChange={e => setSeller({...seller, address: e.target.value})} />
                </div>
                <div className="p-3 bg-gray-50 border border-gray-100 rounded-xl">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">Buyer (Consignee)</span>
                  <input placeholder="Company Name" className="w-full text-sm bg-transparent font-medium outline-none mb-1" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} />
                  <textarea placeholder="Address" rows={2} className="w-full text-xs text-gray-600 bg-transparent outline-none resize-none" value={buyer.address} onChange={e => setBuyer({...buyer, address: e.target.value})} />
                </div>
              </div>
            </div>

            {/* Financial Modifiers */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2 mb-4"><CreditCard size={18} className="text-gray-500"/> Adjustments</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-gray-600">Origin Handling (FOB)</label>
                  <input type="number" className="w-24 text-right text-sm border-b border-gray-200 outline-none" value={handlingFee} onChange={e => setHandlingFee(Number(e.target.value))} />
                </div>
                
                {['CFR', 'CIF'].includes(tradeTerm) && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <label className="text-sm text-gray-600">Freight Charge (CFR)</label>
                    <input type="number" className="w-24 text-right text-sm border-b border-gray-200 outline-none" value={freightCharge} onChange={e => setFreightCharge(Number(e.target.value))} />
                  </div>
                )}

                {tradeTerm === 'CIF' && (
                  <div className="flex justify-between items-center pt-2 border-t border-gray-50">
                    <label className="text-sm text-gray-600">Insurance (%)</label>
                    <input type="number" step="0.1" className="w-24 text-right text-sm border-b border-gray-200 outline-none" value={insurance.percentage} onChange={e => setInsurance({...insurance, percentage: Number(e.target.value)})} />
                  </div>
                )}

                <div className="flex justify-between items-center pt-4 border-t border-gray-100">
                  <label className="text-sm text-gray-600">Discount</label>
                  <input type="number" className="w-24 text-right text-sm text-red-500 border-b border-gray-200 outline-none" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                </div>
                <div className="flex justify-between items-center pt-2">
                  <label className="text-sm text-gray-600">Advance Paid</label>
                  <input type="number" className="w-24 text-right text-sm text-green-600 border-b border-gray-200 outline-none" value={advancePayment} onChange={e => setAdvancePayment(Number(e.target.value))} />
                </div>
              </div>
            </div>

          </div>

          {/* Interactive Preview & Line Items */}
          <div className="lg:col-span-8 space-y-6 print:col-span-12 print:space-y-0">
            
            {/* Table Builder */}
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-x-auto print:hidden">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-gray-800 flex items-center gap-2"><Box size={18} className="text-gray-500"/> Commercial Items</h3>
                <button onClick={addItem} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 font-medium"><Plus size={16}/> Add Item</button>
              </div>
              
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500 uppercase tracking-wide">
                    <th className="pb-3 font-medium">Description & HS Code</th>
                    <th className="pb-3 font-medium text-right">Qty</th>
                    <th className="pb-3 font-medium px-2">Unit</th>
                    <th className="pb-3 font-medium text-right">Unit Price</th>
                    <th className="pb-3 font-medium text-right">Total</th>
                    <th className="pb-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(item => (
                    <tr key={item.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors group">
                      <td className="py-3">
                        <input placeholder="Item Description" className="w-full text-sm font-medium outline-none bg-transparent" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} />
                        <input placeholder="HS Code" className="w-full text-xs text-gray-500 outline-none bg-transparent mt-1" value={item.hsCode} onChange={e => updateItem(item.id, 'hsCode', e.target.value)} />
                      </td>
                      <td className="py-3 text-right">
                        <input type="number" className="w-16 text-right text-sm outline-none bg-transparent border-b border-transparent focus:border-gray-200" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', Number(e.target.value))} />
                      </td>
                      <td className="py-3 px-2">
                        <select className="text-sm text-gray-600 outline-none bg-transparent" value={item.unit} onChange={e => updateItem(item.id, 'unit', e.target.value)}>
                          <option>MT</option><option>KGS</option><option>PCS</option><option>CBM</option><option>BOX</option>
                        </select>
                      </td>
                      <td className="py-3 text-right">
                        <input type="number" className="w-20 text-right text-sm outline-none bg-transparent border-b border-transparent focus:border-gray-200" value={item.unitPrice} onChange={e => updateItem(item.id, 'unitPrice', Number(e.target.value))} />
                      </td>
                      <td className="py-3 text-right text-sm font-medium text-gray-700">
                        {formatCurrency(item.quantity * item.unitPrice)}
                      </td>
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
                className="bg-white shadow-xl w-[210mm] min-h-[297mm] p-[15mm] text-black shrink-0 relative print:shadow-none print:w-full print:min-h-0 print:p-0"
                style={{ fontSize: '11px', fontFamily: '"Inter", sans-serif' }}
              >
                {/* Header */}
                <div className="flex justify-between items-start border-b-2 border-gray-800 pb-6 mb-6">
                  <div>
                    <h1 className="text-3xl font-black tracking-tight text-gray-900 mb-1">{seller.name}</h1>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed">{seller.address}</p>
                    <p className="text-gray-600 mt-1 font-medium">{seller.taxId}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-gray-300 uppercase tracking-widest">Commercial Invoice</h2>
                    <div className="mt-4 space-y-1">
                      <p><span className="text-gray-500 font-medium">Invoice No:</span> <span className="font-bold ml-2">{logistics.invoiceNo}</span></p>
                      <p><span className="text-gray-500 font-medium">Date:</span> <span className="font-bold ml-2">{logistics.date}</span></p>
                    </div>
                  </div>
                </div>

                {/* Parties Grid */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div className="bg-gray-50 p-4 border-l-4 border-gray-800">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Billed To (Consignee)</h4>
                    <p className="font-bold text-base text-gray-900">{buyer.name}</p>
                    <p className="text-gray-600 whitespace-pre-line mt-1">{buyer.address}</p>
                    <p className="text-gray-600 mt-1">{buyer.country}</p>
                    <p className="text-gray-600 mt-2 font-medium">{buyer.taxId}</p>
                  </div>
                  <div className="border border-gray-200 p-4 bg-white">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Logistics Information</h4>
                    <table className="w-full text-xs">
                      <tbody>
                        <tr><td className="py-1 text-gray-500">Term:</td><td className="py-1 font-bold">{tradeTerm} {logistics.pod}</td></tr>
                        <tr><td className="py-1 text-gray-500">Payment:</td><td className="py-1 font-medium">{logistics.paymentTerms}</td></tr>
                        <tr><td className="py-1 text-gray-500">POL:</td><td className="py-1 font-medium">{logistics.pol}</td></tr>
                        <tr><td className="py-1 text-gray-500">Vessel:</td><td className="py-1 font-medium">{logistics.vessel || 'TBA'}</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Line Items Table */}
                <table className="w-full mb-8 text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-800 text-white">
                      <th className="py-2 px-3 font-semibold text-xs w-12">#</th>
                      <th className="py-2 px-3 font-semibold text-xs">Description of Goods</th>
                      <th className="py-2 px-3 font-semibold text-xs w-20">HS Code</th>
                      <th className="py-2 px-3 font-semibold text-xs text-right w-16">Qty</th>
                      <th className="py-2 px-3 font-semibold text-xs text-right w-24">Price ({currency})</th>
                      <th className="py-2 px-3 font-semibold text-xs text-right w-28">Total ({currency})</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-200">
                        <td className="py-3 px-3 text-gray-500">{idx + 1}</td>
                        <td className="py-3 px-3 font-medium text-gray-900">{item.description}</td>
                        <td className="py-3 px-3 text-gray-600">{item.hsCode}</td>
                        <td className="py-3 px-3 text-right">{item.quantity} {item.unit}</td>
                        <td className="py-3 px-3 text-right">{new Intl.NumberFormat('en-US').format(item.unitPrice)}</td>
                        <td className="py-3 px-3 text-right font-medium">{new Intl.NumberFormat('en-US').format(item.quantity * item.unitPrice)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals & Bank Details */}
                <div className="flex justify-between items-start gap-8">
                  {/* Bank Details */}
                  <div className="w-1/2">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Wire Transfer Instructions</h4>
                    <div className="bg-gray-50 p-3 text-xs text-gray-700 whitespace-pre-line border border-gray-200">
                      {seller.bankDetails}
                    </div>
                  </div>
                  
                  {/* Totals Calculation */}
                  <div className="w-1/2">
                    <table className="w-full text-sm">
                      <tbody>
                        <tr>
                          <td className="py-1.5 text-gray-600">Subtotal (Items)</td>
                          <td className="py-1.5 text-right font-medium">{formatCurrency(totals.itemsSum)}</td>
                        </tr>
                        <tr>
                          <td className="py-1.5 text-gray-600">Origin Handling</td>
                          <td className="py-1.5 text-right font-medium">{formatCurrency(handlingFee)}</td>
                        </tr>
                        <tr className="border-b border-gray-200">
                          <td className="py-1.5 font-bold text-gray-800">FOB Value</td>
                          <td className="py-1.5 text-right font-bold">{formatCurrency(totals.fobTotal)}</td>
                        </tr>
                        
                        {['CFR', 'CIF'].includes(tradeTerm) && (
                          <>
                            <tr>
                              <td className="py-1.5 text-gray-600">Freight Charges</td>
                              <td className="py-1.5 text-right font-medium">{formatCurrency(freightCharge)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-1.5 font-bold text-gray-800">CFR Value</td>
                              <td className="py-1.5 text-right font-bold">{formatCurrency(totals.cfrTotal)}</td>
                            </tr>
                          </>
                        )}

                        {tradeTerm === 'CIF' && (
                          <>
                            <tr>
                              <td className="py-1.5 text-gray-600">Marine Insurance</td>
                              <td className="py-1.5 text-right font-medium">{formatCurrency(totals.insuranceCalculated)}</td>
                            </tr>
                            <tr className="border-b border-gray-200">
                              <td className="py-1.5 font-bold text-gray-800">CIF Value</td>
                              <td className="py-1.5 text-right font-bold">{formatCurrency(totals.cifTotal)}</td>
                            </tr>
                          </>
                        )}

                        {discount > 0 && (
                          <tr>
                            <td className="py-1.5 text-red-600">Discount</td>
                            <td className="py-1.5 text-right font-medium text-red-600">-{formatCurrency(discount)}</td>
                          </tr>
                        )}
                        
                        <tr className="bg-gray-800 text-white">
                          <td className="py-2 px-3 font-bold">TOTAL AMOUNT ({tradeTerm})</td>
                          <td className="py-2 px-3 text-right font-bold text-lg">{formatCurrency(totals.grandTotal)}</td>
                        </tr>

                        {advancePayment > 0 && (
                          <>
                            <tr>
                              <td className="py-1.5 text-green-700 pl-3">Advance Payment Received</td>
                              <td className="py-1.5 text-right font-medium text-green-700">-{formatCurrency(advancePayment)}</td>
                            </tr>
                            <tr className="bg-gray-100">
                              <td className="py-2 px-3 font-bold text-gray-900">NET BALANCE DUE</td>
                              <td className="py-2 px-3 text-right font-bold text-lg text-gray-900">{formatCurrency(totals.netBalance)}</td>
                            </tr>
                          </>
                        )}

                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer / Signatures */}
                <div className="mt-16 flex justify-between items-end pt-8">
                  <div className="text-xs text-gray-400 max-w-[50%]">
                    <p>Generated by Pentapeaks Trade Portal</p>
                    <p>All goods remain property of {seller.name} until paid in full.</p>
                  </div>
                  <div className="w-48 text-center border-t border-gray-400 pt-2">
                    <p className="text-xs font-bold text-gray-800">Authorized Signature</p>
                    <p className="text-[10px] text-gray-500">{seller.name}</p>
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
