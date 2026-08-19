"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Calculator, Copy, RefreshCw, Box, Anchor, Plane, DollarSign, Percent, PackageOpen, Check, Lock } from "lucide-react";

type CalcTab = "import_duty" | "container_cbm" | "export_pricing" | "freight_compare" | "currency";

// Helper for parsing empty string to 0 for calculations
const num = (val: number | "") => (val === "" ? 0 : Number(val));

export default function TradeCalculatorsSuite() {
  const [activeTab, setActiveTab] = useState<CalcTab>("import_duty");
  const [copied, setCopied] = useState(false);
  
  // Auth State
  const [user, setUser] = useState<{ role?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth/me')
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // --- A. Import Duty State ---
  const [impCif, setImpCif] = useState<number | "">("");
  const [impCd, setImpCd] = useState<number | "">("");
  const [impRd, setImpRd] = useState<number | "">("");
  const [impAcd, setImpAcd] = useState<number | "">("");
  const [impSt, setImpSt] = useState<number | "">("");
  const [impAit, setImpAit] = useState<number | "">("");
  const [impPortFee, setImpPortFee] = useState<number | "">("");
  const [impQty, setImpQty] = useState<number | "">("");

  // --- B. Container CBM State ---
  const [cbmLength, setCbmLength] = useState<number | "">("");
  const [cbmWidth, setCbmWidth] = useState<number | "">("");
  const [cbmHeight, setCbmHeight] = useState<number | "">("");
  const [cbmWeight, setCbmWeight] = useState<number | "">("");
  const [cbmCartons, setCbmCartons] = useState<number | "">("");
  const [cbmUnit, setCbmUnit] = useState<"cm" | "inch">("cm");
  const [containerVol, setContainerVol] = useState<number | "">(33.2); // 20ft std
  const [containerMaxW, setContainerMaxW] = useState<number | "">(28000);

  // --- C. Export Pricing State ---
  const [expCost, setExpCost] = useState<number | "">("");
  const [expPack, setExpPack] = useState<number | "">("");
  const [expInland, setExpInland] = useState<number | "">("");
  const [expPort, setExpPort] = useState<number | "">("");
  const [expFreight, setExpFreight] = useState<number | "">("");
  const [expIns, setExpIns] = useState<number | "">("");
  const [expMargin, setExpMargin] = useState<number | "">("");
  const [expUnits, setExpUnits] = useState<number | "">("");

  // --- D. Air vs Sea State ---
  const [frL, setFrL] = useState<number | "">("");
  const [frW, setFrW] = useState<number | "">("");
  const [frH, setFrH] = useState<number | "">("");
  const [frPkg, setFrPkg] = useState<number | "">("");
  const [frWeight, setFrWeight] = useState<number | "">("");
  const [frAirRate, setFrAirRate] = useState<number | "">("");
  const [frSeaRate, setFrSeaRate] = useState<number | "">("");

  // --- E. Currency State ---
  const [currVal, setCurrVal] = useState<number | "">("");
  const [currBook, setCurrBook] = useState<number | "">("");
  const [currSet, setCurrSet] = useState<number | "">("");

  // --- Calculations ---

  // A. Import Duty
  const dutyResults = useMemo(() => {
    const cif = num(impCif);
    const cd = cif * (num(impCd) / 100);
    const rd = cif * (num(impRd) / 100);
    const acd = cif * (num(impAcd) / 100);
    const stBase = cif + cd + rd + acd;
    const st = stBase * (num(impSt) / 100);
    const aitBase = stBase + st;
    const ait = aitBase * (num(impAit) / 100);
    
    const totalDuty = cd + rd + acd + st + ait;
    const totalCost = cif + totalDuty + num(impPortFee);
    const qty = num(impQty);
    const perUnit = qty > 0 ? totalCost / qty : 0;

    return { cd, rd, acd, st, ait, totalDuty, totalCost, perUnit };
  }, [impCif, impCd, impRd, impAcd, impSt, impAit, impPortFee, impQty]);

  // B. Container CBM
  const cbmResults = useMemo(() => {
    const l = num(cbmLength);
    const w = num(cbmWidth);
    const h = num(cbmHeight);
    const wt = num(cbmWeight);
    const ctns = num(cbmCartons);
    const maxV = num(containerVol) || 1;
    const maxW = num(containerMaxW) || 1;

    let volPerCtn = 0;
    if (cbmUnit === "cm") volPerCtn = (l * w * h) / 1000000;
    if (cbmUnit === "inch") volPerCtn = (l * w * h) / 61023.7;

    const totalVol = volPerCtn * ctns;
    const totalWt = wt * ctns;

    const volUtil = Math.min((totalVol / maxV) * 100, 100);
    const wtUtil = Math.min((totalWt / maxW) * 100, 100);

    const fitVol = volPerCtn > 0 ? Math.floor(maxV / volPerCtn) : 0;
    const fitWt = wt > 0 ? Math.floor(maxW / wt) : 0;

    return { volPerCtn, totalVol, totalWt, volUtil, wtUtil, fitVol, fitWt };
  }, [cbmLength, cbmWidth, cbmHeight, cbmWeight, cbmCartons, cbmUnit, containerVol, containerMaxW]);

  // C. Export Pricing
  const expResults = useMemo(() => {
    const exw = num(expCost) + num(expPack);
    const units = num(expUnits) || 1;
    
    const fob = exw + ((num(expInland) + num(expPort)) / units);
    const cfr = fob + (num(expFreight) / units);
    const cif = cfr + (num(expIns) / units);
    
    const margin = num(expMargin);
    const sellPrice = margin >= 100 ? 0 : cif / (1 - (margin / 100)); // prevent div zero
    
    const totalRev = sellPrice * units;
    const totalCost = cif * units;
    const profit = totalRev - totalCost;

    return { exw, fob, cfr, cif, sellPrice, totalRev, totalCost, profit };
  }, [expCost, expPack, expInland, expPort, expFreight, expIns, expMargin, expUnits]);

  // D. Freight Compare
  const frResults = useMemo(() => {
    const pkgs = num(frPkg);
    const gw = num(frWeight) * pkgs;
    const vol = (num(frL) * num(frW) * num(frH) / 1000000) * pkgs;
    const volWt = (num(frL) * num(frW) * num(frH) / 6000) * pkgs;
    
    const chgAir = Math.max(gw, volWt);
    const chgSea = Math.max(vol, gw / 1000);
    
    const airCost = chgAir * num(frAirRate);
    const seaCost = chgSea * num(frSeaRate);

    return { gw, vol, volWt, chgAir, chgSea, airCost, seaCost };
  }, [frL, frW, frH, frPkg, frWeight, frAirRate, frSeaRate]);

  // E. Currency
  const curResults = useMemo(() => {
    const v = num(currVal);
    const b = num(currBook);
    const s = num(currSet);
    
    const bookVal = v * b;
    const setVal = v * s;
    const diff = setVal - bookVal;
    const impact = bookVal > 0 ? (diff / bookVal) * 100 : 0;

    return { bookVal, setVal, diff, impact };
  }, [currVal, currBook, currSet]);

  // Actions
  const handleReset = () => {
    if (activeTab === "import_duty") {
      setImpCif(""); setImpCd(""); setImpRd(""); setImpAcd(""); setImpSt(""); setImpAit(""); setImpPortFee(""); setImpQty("");
    }
    if (activeTab === "container_cbm") {
      setCbmLength(""); setCbmWidth(""); setCbmHeight(""); setCbmWeight(""); setCbmCartons("");
    }
    if (activeTab === "export_pricing") {
      setExpCost(""); setExpPack(""); setExpInland(""); setExpPort(""); setExpFreight(""); setExpIns(""); setExpMargin(""); setExpUnits("");
    }
    if (activeTab === "freight_compare") {
      setFrL(""); setFrW(""); setFrH(""); setFrPkg(""); setFrWeight(""); setFrAirRate(""); setFrSeaRate("");
    }
    if (activeTab === "currency") {
      setCurrVal(""); setCurrBook(""); setCurrSet("");
    }
  };

  const copyResults = () => {
    let text = "";
    if (activeTab === "import_duty") {
      text = `Landed Cost Summary:\nTotal Duty & Taxes: ${dutyResults.totalDuty.toFixed(2)}\nTotal Landed Cost: ${dutyResults.totalCost.toFixed(2)}\nPer Unit Cost: ${dutyResults.perUnit.toFixed(2)}`;
    }
    if (activeTab === "container_cbm") {
      text = `CBM Summary:\nTotal Volume: ${cbmResults.totalVol.toFixed(3)} CBM\nTotal Weight: ${cbmResults.totalWt.toFixed(2)} KG\nVolume Utilization: ${cbmResults.volUtil.toFixed(1)}%`;
    }
    if (activeTab === "export_pricing") {
      text = `Export Pricing:\nFOB Price: ${expResults.fob.toFixed(2)}\nCIF Price: ${expResults.cif.toFixed(2)}\nTarget Sell Price: ${expResults.sellPrice.toFixed(2)}\nTotal Profit: ${expResults.profit.toFixed(2)}`;
    }
    if (activeTab === "freight_compare") {
      text = `Freight Comparison:\nChargeable Air Weight: ${frResults.chgAir.toFixed(2)} KG\nTotal Air Freight: ${frResults.airCost.toFixed(2)}\nTotal Sea Freight: ${frResults.seaCost.toFixed(2)}`;
    }
    if (activeTab === "currency") {
      text = `Currency Impact:\nForex Gain/Loss: ${curResults.diff.toFixed(2)}\nMargin Impact: ${curResults.impact.toFixed(2)}%`;
    }
    
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(val);

  if (loading) return null;

  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-6">
        <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-6 h-6 text-amber-600"/>
        </div>
        <h2 className="text-xl font-bold text-gray-900 mb-2">Admin Feature Only</h2>
        <p className="text-sm text-gray-500 max-w-md">
          The Trade Calculators Suite is currently available exclusively to system administrators during rollout.
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 pb-20">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-900"><Calculator className="text-blue-600" /> Trade Calculators Suite</h1>
            <p className="text-gray-500 text-sm mt-1">Dynamic estimators for import, export, logistics, and pricing.</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleReset} className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              <RefreshCw size={16} /> Reset
            </button>
            <button onClick={copyResults} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
              {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? "Copied!" : "Copy Summary"}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
          {[
            { id: "import_duty", label: "Import Landed Cost", icon: <DollarSign size={16}/> },
            { id: "container_cbm", label: "Container CBM", icon: <Box size={16}/> },
            { id: "export_pricing", label: "Export Pricing", icon: <Percent size={16}/> },
            { id: "freight_compare", label: "Air vs Sea Freight", icon: <Plane size={16}/> },
            { id: "currency", label: "Currency Impact", icon: <RefreshCw size={16}/> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as CalcTab)}
              className={`flex items-center gap-2 whitespace-nowrap px-5 py-3 rounded-xl font-medium text-sm transition-all shadow-sm ${
                activeTab === tab.id 
                  ? 'bg-blue-900 text-white shadow-blue-900/20' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-100'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Active Calculator Module */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8">
          
          {/* =========================================
              A. IMPORT DUTY & LANDED COST
             ========================================= */}
          {activeTab === "import_duty" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-800">Inputs</h3>
                  <p className="text-xs text-gray-500 mt-1">Enter the assessed CIF value of your goods and the applicable taxation percentages from your customs tariff sheet to calculate your final landed cost per unit.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Assessable CIF Value</label>
                    <input type="number" placeholder="0.00" value={impCif} onChange={(e) => setImpCif(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Customs Duty (CD %)</label>
                    <input type="number" placeholder="0" value={impCd} onChange={(e) => setImpCd(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Regulatory Duty (RD %)</label>
                    <input type="number" placeholder="0" value={impRd} onChange={(e) => setImpRd(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Additional CD (ACD %)</label>
                    <input type="number" placeholder="0" value={impAcd} onChange={(e) => setImpAcd(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Sales Tax (ST %)</label>
                    <input type="number" placeholder="0" value={impSt} onChange={(e) => setImpSt(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Advance Income Tax (AIT %)</label>
                    <input type="number" placeholder="0" value={impAit} onChange={(e) => setImpAit(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Total Qty / Units</label>
                    <input type="number" placeholder="0" value={impQty} onChange={(e) => setImpQty(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Port & Clearing Handling Fees</label>
                    <input type="number" placeholder="0.00" value={impPortFee} onChange={(e) => setImpPortFee(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Landed Cost Summary</h3>
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Customs Duty (CD)</span> <span className="font-medium text-gray-900">{formatMoney(dutyResults.cd)}</span></div>
                  <div className="flex justify-between"><span>Regulatory Duty (RD)</span> <span className="font-medium text-gray-900">{formatMoney(dutyResults.rd)}</span></div>
                  <div className="flex justify-between"><span>Additional CD (ACD)</span> <span className="font-medium text-gray-900">{formatMoney(dutyResults.acd)}</span></div>
                  <div className="flex justify-between"><span>Sales Tax (ST)</span> <span className="font-medium text-gray-900">{formatMoney(dutyResults.st)}</span></div>
                  <div className="flex justify-between"><span>Advance Income Tax (AIT)</span> <span className="font-medium text-gray-900">{formatMoney(dutyResults.ait)}</span></div>
                  <div className="border-t border-gray-200 my-2 pt-2 flex justify-between font-bold text-gray-800">
                    <span>Total Import Duty & Taxes</span> <span>{formatMoney(dutyResults.totalDuty)}</span>
                  </div>
                </div>

                <div className="mt-6 p-4 bg-blue-900 text-white rounded-lg shadow-sm">
                  <div className="flex justify-between items-center text-blue-100 text-xs uppercase font-bold mb-1">
                    <span>Total Landed Cost</span> <span>Per Unit</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black tracking-tight">{formatMoney(dutyResults.totalCost)}</span>
                    <span className="text-lg font-bold">{formatMoney(dutyResults.perUnit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              B. CONTAINER CBM & STUFFING
             ========================================= */}
          {activeTab === "container_cbm" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-5">
                <div className="flex justify-between items-end border-b pb-2">
                  <div>
                    <h3 className="text-lg font-bold text-gray-800">Carton Specs</h3>
                    <p className="text-xs text-gray-500 mt-1">Enter your individual carton dimensions to calculate volumetric utilization and max container capacity.</p>
                  </div>
                  <select className="text-sm bg-gray-100 rounded px-2 py-1 outline-none text-gray-700 h-8" value={cbmUnit} onChange={(e) => setCbmUnit(e.target.value as "cm" | "inch")}>
                    <option value="cm">Centimeters (cm)</option>
                    <option value="inch">Inches (in)</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Length</label>
                    <input type="number" placeholder="0" value={cbmLength} onChange={(e) => setCbmLength(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Width</label>
                    <input type="number" placeholder="0" value={cbmWidth} onChange={(e) => setCbmWidth(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Height</label>
                    <input type="number" placeholder="0" value={cbmHeight} onChange={(e) => setCbmHeight(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Weight/Ctn (kg)</label>
                    <input type="number" placeholder="0" value={cbmWeight} onChange={(e) => setCbmWeight(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Total Number of Cartons</label>
                    <input type="number" placeholder="0" value={cbmCartons} onChange={(e) => setCbmCartons(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4">Container Specs</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Container Volume (CBM)</label>
                    <input type="number" placeholder="33.2" value={containerVol} onChange={(e) => setContainerVol(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Max Payload (KG)</label>
                    <input type="number" placeholder="28000" value={containerMaxW} onChange={(e) => setContainerMaxW(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Stuffing Estimates</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Cargo Volume</p>
                    <p className="text-2xl font-black text-gray-900">{cbmResults.totalVol.toFixed(3)} <span className="text-sm font-medium text-gray-500">CBM</span></p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 text-center">
                    <p className="text-xs text-gray-500 font-bold uppercase mb-1">Total Cargo Weight</p>
                    <p className="text-2xl font-black text-gray-900">{cbmResults.totalWt.toFixed(1)} <span className="text-sm font-medium text-gray-500">KG</span></p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-600">Volume Utilization</span>
                    <span className={cbmResults.volUtil > 100 ? "text-red-600" : "text-emerald-600"}>{cbmResults.volUtil.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${cbmResults.volUtil > 100 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(cbmResults.volUtil, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-gray-600">Weight Utilization</span>
                    <span className={cbmResults.wtUtil > 100 ? "text-red-600" : "text-emerald-600"}>{cbmResults.wtUtil.toFixed(1)}%</span>
                  </div>
                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div className={`h-full ${cbmResults.wtUtil > 100 ? "bg-red-500" : "bg-emerald-500"}`} style={{ width: `${Math.min(cbmResults.wtUtil, 100)}%` }}></div>
                  </div>
                </div>

                <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex items-start gap-3 text-sm text-blue-900">
                  <PackageOpen className="text-blue-600 shrink-0 mt-0.5" size={18} />
                  <div>
                    <span className="font-bold block mb-1">Maximum Capacity Check</span>
                    Theoretical max cartons this container can hold by volume is <strong>{cbmResults.fitVol}</strong>. 
                    Max by weight is <strong>{cbmResults.fitWt}</strong>.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              C. EXPORT PRICING & INCOTERMS
             ========================================= */}
          {activeTab === "export_pricing" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-800">Unit & Logistics Inputs</h3>
                  <p className="text-xs text-gray-500 mt-1">Input your manufacturing and logistics costs to build up your pricing at each Incoterm stage. Set a target margin to calculate your recommended selling price.</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Total Shipment Units</label>
                    <input type="number" placeholder="1000" value={expUnits} onChange={(e) => setExpUnits(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Ex-Factory Cost (Per Unit)</label>
                    <input type="number" placeholder="0.00" value={expCost} onChange={(e) => setExpCost(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Export Packaging (Per Unit)</label>
                    <input type="number" placeholder="0.00" value={expPack} onChange={(e) => setExpPack(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Inland Transport (Total)</label>
                    <input type="number" placeholder="0.00" value={expInland} onChange={(e) => setExpInland(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Port THC & Clearance (Total)</label>
                    <input type="number" placeholder="0.00" value={expPort} onChange={(e) => setExpPort(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Sea/Air Freight (Total)</label>
                    <input type="number" placeholder="0.00" value={expFreight} onChange={(e) => setExpFreight(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Cargo Insurance (Total)</label>
                    <input type="number" placeholder="0.00" value={expIns} onChange={(e) => setExpIns(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-blue-600 font-bold mb-1 block">Target Profit Margin (%)</label>
                    <input type="number" placeholder="0" value={expMargin} onChange={(e) => setExpMargin(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border-2 border-blue-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-blue-50/50 text-blue-900 font-bold" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-4">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Unit Price Buildup</h3>
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between items-center"><span className="w-24">EXW Price</span> <span className="border-b border-gray-300 border-dotted flex-1 mx-3"></span> <span className="font-bold text-gray-900">{formatMoney(expResults.exw)}</span></div>
                  <div className="flex justify-between items-center"><span className="w-24">FOB Price</span> <span className="border-b border-gray-300 border-dotted flex-1 mx-3"></span> <span className="font-bold text-gray-900">{formatMoney(expResults.fob)}</span></div>
                  <div className="flex justify-between items-center"><span className="w-24">CFR Price</span> <span className="border-b border-gray-300 border-dotted flex-1 mx-3"></span> <span className="font-bold text-gray-900">{formatMoney(expResults.cfr)}</span></div>
                  <div className="flex justify-between items-center"><span className="w-24">CIF Price</span> <span className="border-b border-gray-300 border-dotted flex-1 mx-3"></span> <span className="font-bold text-gray-900">{formatMoney(expResults.cif)}</span></div>
                </div>

                <div className="mt-6 p-4 bg-[#1e293b] text-white rounded-lg shadow-sm">
                  <div className="flex justify-between items-center text-gray-300 text-xs uppercase font-bold mb-1">
                    <span>Target Selling Price (CIF)</span> <span>Net Profit</span>
                  </div>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl font-black tracking-tight text-emerald-400">{formatMoney(expResults.sellPrice)}</span>
                    <span className="text-lg font-bold text-white">{formatMoney(expResults.profit)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              D. AIR VS SEA FREIGHT
             ========================================= */}
          {activeTab === "freight_compare" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-800">Cargo Dimensions (cm)</h3>
                  <p className="text-xs text-gray-500 mt-1">Compare the true cost of shipping. The calculator automatically determines the chargeable volumetric weight for air freight.</p>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Length</label>
                    <input type="number" placeholder="0" value={frL} onChange={(e) => setFrL(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Width</label>
                    <input type="number" placeholder="0" value={frW} onChange={(e) => setFrW(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Height</label>
                    <input type="number" placeholder="0" value={frH} onChange={(e) => setFrH(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-1">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Gross Wt/Pkg (kg)</label>
                    <input type="number" placeholder="0" value={frWeight} onChange={(e) => setFrWeight(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Total Packages</label>
                    <input type="number" placeholder="0" value={frPkg} onChange={(e) => setFrPkg(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>

                <h3 className="text-lg font-bold text-gray-800 border-b pb-2 pt-4">Freight Rates</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Air Rate (per kg)</label>
                    <input type="number" placeholder="0.00" value={frAirRate} onChange={(e) => setFrAirRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Sea LCL Rate (per CBM)</label>
                    <input type="number" placeholder="0.00" value={frSeaRate} onChange={(e) => setFrSeaRate(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Cost Comparison</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-blue-700 font-bold mb-2 uppercase text-xs tracking-wider">
                      <Plane size={16}/> Air Freight
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Chargeable: {frResults.chgAir.toFixed(1)} kg</div>
                    <p className="text-2xl font-black text-gray-900">{formatMoney(frResults.airCost)}</p>
                  </div>
                  <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 text-emerald-700 font-bold mb-2 uppercase text-xs tracking-wider">
                      <Anchor size={16}/> Sea Freight (LCL)
                    </div>
                    <div className="text-xs text-gray-500 mb-2">Chargeable: {frResults.chgSea.toFixed(2)} w/m</div>
                    <p className="text-2xl font-black text-gray-900">{formatMoney(frResults.seaCost)}</p>
                  </div>
                </div>

                <div className="bg-gray-200/50 p-4 rounded-lg text-sm text-gray-700 space-y-2">
                  <div className="flex justify-between"><span className="font-medium">Total Gross Weight</span> <span>{frResults.gw.toFixed(2)} kg</span></div>
                  <div className="flex justify-between"><span className="font-medium">Total Volume</span> <span>{frResults.vol.toFixed(3)} CBM</span></div>
                  <div className="flex justify-between"><span className="font-medium">Air Volumetric Weight</span> <span>{frResults.volWt.toFixed(2)} kg</span></div>
                </div>
              </div>
            </div>
          )}

          {/* =========================================
              E. CURRENCY FLUCTUATION
             ========================================= */}
          {activeTab === "currency" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-5">
                <div className="border-b pb-2">
                  <h3 className="text-lg font-bold text-gray-800">Forex Inputs</h3>
                  <p className="text-xs text-gray-500 mt-1">Calculate the financial impact of exchange rate movements on your profit margins between the time of contract booking and final settlement.</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Foreign Contract Value (e.g. USD)</label>
                    <input type="number" placeholder="0.00" value={currVal} onChange={(e) => setCurrVal(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 text-gray-900 bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Booking Exchange Rate</label>
                    <input type="number" placeholder="0.00" value={currBook} onChange={(e) => setCurrBook(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 font-medium mb-1 block">Actual Settlement Rate</label>
                    <input type="number" placeholder="0.00" value={currSet} onChange={(e) => setCurrSet(e.target.value === "" ? "" : Number(e.target.value))} className="w-full border border-gray-200 rounded-lg p-2.5 outline-none focus:border-blue-500 bg-gray-50 text-gray-900" />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 space-y-6">
                <h3 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Impact Analysis</h3>
                
                <div className="space-y-3 text-sm text-gray-600">
                  <div className="flex justify-between"><span>Expected Local Value</span> <span className="font-bold text-gray-900">{formatMoney(curResults.bookVal)}</span></div>
                  <div className="flex justify-between"><span>Actual Settled Value</span> <span className="font-bold text-gray-900">{formatMoney(curResults.setVal)}</span></div>
                </div>

                <div className={`p-4 rounded-lg shadow-sm ${curResults.diff >= 0 ? 'bg-emerald-50 border border-emerald-200' : 'bg-red-50 border border-red-200'}`}>
                  <p className={`text-xs uppercase font-bold mb-1 ${curResults.diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {curResults.diff >= 0 ? "Forex Gain" : "Forex Loss"}
                  </p>
                  <div className="flex justify-between items-end">
                    <span className={`text-2xl font-black ${curResults.diff >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                      {formatMoney(Math.abs(curResults.diff))}
                    </span>
                    <span className={`text-lg font-bold ${curResults.diff >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {curResults.diff >= 0 ? "+" : ""}{curResults.impact.toFixed(2)}% margin
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
