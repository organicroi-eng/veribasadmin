import { useState, useEffect, useCallback } from "react"

function useWidth() {
  const [w, setW] = useState(window.innerWidth)
  useEffect(() => { const h = () => setW(window.innerWidth); window.addEventListener("resize",h); return()=>window.removeEventListener("resize",h) },[])
  return w
}

const C = {
  bg:"#0b1120", surface:"#111827", card:"#1a2336", cardHv:"#1f2d42",
  border:"#1e2d45", borderLt:"#2d3f5a",
  blue:"#3b82f6", blueDk:"#1d4ed8", blueBg:"#0f1e38", blueBd:"#1e3860",
  white:"#f1f5f9", white2:"#94a3b8", muted:"#475569",
  green:"#10b981", red:"#ef4444", amber:"#f59e0b",
  purple:"#8b5cf6", cyan:"#06b6d4", orange:"#f97316",
}

const STATUS_COLOR = {
  "New":C.white2,"Contacted":C.blue,"Qualified":C.cyan,"NDA Signed":C.purple,
  "Offer Submitted":C.amber,"Negotiating":C.amber,"Under Review":C.blue,
  "Under Contract":C.green,"Due Diligence":C.cyan,"Closed":C.green,"Dead":C.red
}


// ─── SUPABASE ─────────────────────────────────────────────────────────────────
const SUPA_URL = "https://dsoydsncwltjyvhakwvn.supabase.co"
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzb3lkc25jd2x0anl2aGFrd3ZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc0MTkzOTgsImV4cCI6MjA5Mjk5NTM5OH0.hIe-gbqhcJ_H0VHPbqxNhYPNMPLfy86ggky-mUqjQ1c"

async function sb(path, opts={}) {
  const res = await fetch(SUPA_URL + "/rest/v1/" + path, {
    method: opts.method || "GET",
    headers: {
      "apikey": SUPA_KEY,
      "Authorization": "Bearer " + SUPA_KEY,
      "Content-Type": "application/json",
      "Prefer": opts.method === "POST" ? "return=representation" : opts.method === "PATCH" ? "return=representation" : ""
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  })
  const text = await res.text()
  try { return text ? JSON.parse(text) : null } catch(e) { return null }
}

const TYPE_ICONS = {"Gas Station":"⛽","Convenience Store":"🏪","C-Store":"🏪","Smoke Shop":"💨","Liquor Store":"🍷"}

function normalizeLead(row) {
  let notesArr = []
  try { notesArr = row.notes ? JSON.parse(row.notes) : [] } catch(e) {
    if (row.notes) notesArr = [{text:row.notes, author:"System", ts:row.created_at}]
  }
  return {
    id: row.id,
    site: row.site || "",
    type: row.type || "",
    icon: TYPE_ICONS[row.type] || "🏢",
    firstName: row.first_name || "",
    lastName: row.last_name || "",
    phone: row.phone || "",
    email: row.email || "",
    address: row.address || "",
    askingPrice: Number(row.asking_price) || 0,
    details: row.details || "",
    reason: row.reason || "",
    notes: row.notes || "",
    notesArr,
    status: row.status || "New",
    assignedTo: row.assigned_to ? Number(row.assigned_to) : null,
    ts: row.created_at || new Date().toISOString(),
  }
}

function normalizeDeal(row) {
  let notesArr = []
  try { notesArr = row.notes ? JSON.parse(row.notes) : [] } catch(e) {
    if (row.notes) notesArr = [{text:row.notes, author:"System", ts:row.created_at}]
  }
  return {
    id: row.id,
    portal: row.portal || "",
    listingName: row.listing_name || "",
    listingType: row.listing_type || "",
    buyerName: row.buyer_name || "",
    buyerEmail: row.buyer_email || "",
    buyerPhone: row.buyer_phone || "",
    buyerEntity: row.buyer_entity || "",
    offerPrice: Number(row.offer_price) || 0,
    financing: row.financing || "",
    structure: row.structure || "",
    ddPeriod: row.dd_period || "",
    status: row.status || "New",
    assignedTo: row.assigned_to ? Number(row.assigned_to) : null,
    ts: row.created_at || new Date().toISOString(),
    brokerFee: Number(row.broker_fee) || 0,
    notes: row.notes || "",
    notesArr,
  }
}
// ─────────────────────────────────────────────────────────────────────────────

const USERS_DB = [
  { id:1, name:"Ahsan Charania",   email:"ahsan@veribas.com",   role:"admin",     initials:"AC", password:"#Veribas12345" },
  { id:2, name:"Sarah Johnson",    email:"sarah@veribas.com",   role:"processor", initials:"SJ", password:"proc123"  },
  { id:3, name:"Marcus Williams",  email:"marcus@veribas.com",  role:"processor", initials:"MW", password:"proc456"  },
]

const SELLER_LEADS_DB = [
  { id:1, site:"GasStationCashOffer.com", type:"Gas Station",  icon:"⛽", firstName:"Rajiv",   lastName:"Patel",     phone:"(404) 555-0123", email:"rajiv.patel@example.com",   address:"1450 Peachtree St, Atlanta, GA 30309",   askingPrice:1850000, details:"Shell · 8 pumps · Own land", reason:"Retiring",           ts:"2025-01-15T14:23:00", status:"Contacted",       assignedTo:2, notes:"Very motivated, 22 yrs in business. Ready to move fast." },
  { id:2, site:"WebuyCStores.com",        type:"C-Store",       icon:"🏪", firstName:"Sandra",  lastName:"Kim",       phone:"(704) 555-0456", email:"sandra.kim@example.com",    address:"892 Independence Blvd, Charlotte, NC",  askingPrice:420000,  details:"1,800 sq ft · Lease · Beer & wine", reason:"Relocating",       ts:"2025-01-16T09:15:00", status:"New",             assignedTo:null, notes:"" },
  { id:3, site:"SellMySmokeShop.com",     type:"Smoke Shop",    icon:"💨", firstName:"Derek",   lastName:"Chen",      phone:"(214) 555-0789", email:"derek.chen@example.com",    address:"456 Commerce St, Dallas, TX 75202",     askingPrice:185000,  details:"Vape shop · 18mo lease left", reason:"Competition",         ts:"2025-01-16T11:30:00", status:"Qualified",       assignedTo:3, notes:"18 months left on lease. Very motivated seller." },
  { id:4, site:"WeBuyLiquorStores.com",   type:"Liquor Store",  icon:"🍷", firstName:"Anthony", lastName:"Brown",     phone:"(305) 555-0321", email:"anthony.brown@example.com", address:"2200 Biscayne Blvd, Miami, FL 33137",   askingPrice:680000,  details:"Full spirits · 3,200 sq ft · Lease", reason:"Retiring",       ts:"2025-01-17T08:45:00", status:"NDA Signed",      assignedTo:2, notes:"NDA signed 1/17. Sending financials this week." },
  { id:5, site:"GasStationCashOffer.com", type:"Gas Station",  icon:"⛽", firstName:"Tom",     lastName:"Martinez",  phone:"(713) 555-0654", email:"tom.martinez@example.com",  address:"5500 Westheimer Rd, Houston, TX 77056", askingPrice:2400000, details:"BP · 12 pumps · Own land", reason:"Partnership dispute", ts:"2025-01-17T13:20:00", status:"New",             assignedTo:null, notes:"" },
  { id:6, site:"WeBuyLiquorStores.com",   type:"Liquor Store",  icon:"🍷", firstName:"Carmen",  lastName:"Rodriguez", phone:"(773) 555-0987", email:"carmen.r@example.com",      address:"1847 N Milwaukee Ave, Chicago, IL 60647",askingPrice:750000,  details:"Full spirits · Own building", reason:"Retiring",            ts:"2025-01-18T10:00:00", status:"Offer Submitted", assignedTo:3, notes:"Buyer offer $700k, seller countered at $725k." },
  { id:7, site:"GasStationCashOffer.com", type:"Gas Station",  icon:"⛽", firstName:"Kevin",   lastName:"Singh",     phone:"(615) 555-1234", email:"kevin.singh@example.com",   address:"890 Broadway, Nashville, TN 37203",     askingPrice:1250000, details:"ExxonMobil · 6 pumps · Oil co lease", reason:"Too many headaches", ts:"2025-01-18T15:45:00", status:"Contacted", assignedTo:2, notes:"" },
  { id:8, site:"WebuyCStores.com",        type:"C-Store",       icon:"🏪", firstName:"Lisa",    lastName:"Park",      phone:"(312) 555-5678", email:"lisa.park@example.com",     address:"220 S State St, Chicago, IL 60604",     askingPrice:750000,  details:"2,800 sq ft · Own · Gas on site", reason:"Estate / Inherited", ts:"2025-01-19T08:30:00", status:"New",             assignedTo:null, notes:"" },
]

const BUYER_DEALS_DB = [
  { id:1, portal:"DukaanApna", listingName:"Shell Station & C-Store",     listingType:"Gas Station", buyerName:"Priya Sharma",           buyerEmail:"priya.sharma@example.com", buyerPhone:"(678) 555-1111", buyerEntity:"Sharma Holdings LLC",        offerPrice:1700000, financing:"SBA 7(a)",    structure:"Asset Purchase", ddPeriod:"45 days", status:"Under Review",    assignedTo:2, ts:"2025-01-16T15:30:00", brokerFee:85000,  notes:"Strong buyer, SBA pre-qual letter attached." },
  { id:2, portal:"TillStreet", listingName:"Spirits & Wine Palace",       listingType:"Liquor Store", buyerName:"James Capital Partners", buyerEmail:"james@jcpfund.com",        buyerPhone:"(212) 555-2222", buyerEntity:"JCP Acquisition Fund III LLC",offerPrice:650000,  financing:"Conventional", structure:"Asset Purchase", ddPeriod:"60 days", status:"Negotiating",     assignedTo:3, ts:"2025-01-17T09:45:00", brokerFee:32500,  notes:"PE buyer. Wants environmental indemnification clause." },
  { id:3, portal:"DukaanApna", listingName:"Family Mart — Airport Corridor",listingType:"C-Store",    buyerName:"Raj Patel",              buyerEmail:"raj@patelgroup.com",       buyerPhone:"(480) 555-3333", buyerEntity:"Patel Retail Group LLC",     offerPrice:950000,  financing:"SBA 7(a)",    structure:"Asset Purchase", ddPeriod:"45 days", status:"Under Contract",  assignedTo:2, ts:"2025-01-15T11:20:00", brokerFee:47500,  notes:"Contract signed 1/15. In DD period, closing 2/28." },
  { id:4, portal:"TillStreet", listingName:"Fine Spirits Warehouse",      listingType:"Liquor Store", buyerName:"Metro Acquisitions LLC", buyerEmail:"deals@metroacq.com",       buyerPhone:"(404) 555-4444", buyerEntity:"Metro Acquisitions LLC",     offerPrice:1050000, financing:"All Equity",   structure:"Stock Purchase", ddPeriod:"30 days", status:"New",             assignedTo:null, ts:"2025-01-18T14:15:00", brokerFee:52500,  notes:"" },
  { id:5, portal:"DukaanApna", listingName:"Corner Liquor & Deli",        listingType:"Liquor Store", buyerName:"Harpreet Gill",          buyerEmail:"h.gill@example.com",       buyerPhone:"(929) 555-5555", buyerEntity:"Gill Brothers LLC",          offerPrice:470000,  financing:"SBA 7(a)",    structure:"Asset Purchase", ddPeriod:"45 days", status:"Due Diligence",   assignedTo:3, ts:"2025-01-14T10:00:00", brokerFee:23500,  notes:"License transfer filed 1/18 with NY SLA." },
  { id:6, portal:"TillStreet", listingName:"BP Station — High Volume",    listingType:"Gas Station",  buyerName:"Nexus Capital Group",    buyerEmail:"acq@nexuscap.com",         buyerPhone:"(713) 555-6666", buyerEntity:"Nexus Capital Group LP",     offerPrice:2250000, financing:"Conventional", structure:"Asset Purchase", ddPeriod:"60 days", status:"Closed",          assignedTo:2, ts:"2025-01-10T09:00:00", brokerFee:112500, notes:"Closed 1/22. Commission invoice sent." },
]

const fmt    = n => "$" + Math.round(n).toLocaleString()
const fmtK   = n => n >= 1e6 ? "$"+(n/1e6).toFixed(2)+"M" : "$"+Math.round(n/1000)+"k"
const fmtDate= s => new Date(s).toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})
const fmtTime= s => new Date(s).toLocaleTimeString("en-US",{hour:"numeric",minute:"2-digit"})

// ─── REUSABLE BITS ────────────────────────────────────────────────────────────
function Avatar({name,initials,size=32,color=C.blue}) {
  return <div style={{width:size,height:size,borderRadius:6,background:`${color}20`,border:`1px solid ${color}30`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Outfit',sans-serif",fontSize:size*0.35,fontWeight:700,color,flexShrink:0}}>{initials||name?.[0]}</div>
}

function StatusBadge({status}) {
  const col = STATUS_COLOR[status] || C.white2
  return <span style={{background:`${col}15`,color:col,border:`1px solid ${col}25`,borderRadius:4,fontSize:10,fontWeight:700,padding:"2px 8px",fontFamily:"'Outfit',sans-serif",letterSpacing:"0.07em",whiteSpace:"nowrap"}}>{status.toUpperCase()}</span>
}

function Card({children, style={}}) {
  return <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:10,...style}}>{children}</div>
}

function MetricCard({label,value,sub,color=C.white,icon}) {
  return (
    <Card style={{padding:"20px 22px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:12}}>
        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted}}>{label}</div>
        {icon&&<span style={{fontSize:20}}>{icon}</span>}
      </div>
      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:26,fontWeight:700,color,lineHeight:1,marginBottom:6}}>{value}</div>
      {sub&&<div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{sub}</div>}
    </Card>
  )
}

// ─── AI EMAIL DRAFTER ─────────────────────────────────────────────────────────
function EmailDrafter({deal, dealType, user}) {
  const [emailType, setEmailType] = useState("seller_intro")
  const [draft, setDraft]         = useState("")
  const [loading, setLoading]     = useState(false)

  const EMAIL_TYPES = dealType === "seller" ? [
    { id:"seller_intro",   label:"Seller Introduction"   },
    { id:"seller_followup",label:"Follow-Up"             },
    { id:"seller_nda",     label:"NDA Request"           },
    { id:"seller_offer",   label:"Present Offer"         },
  ] : [
    { id:"buyer_welcome",  label:"Buyer Welcome"         },
    { id:"buyer_showing",  label:"Schedule Showing"      },
    { id:"buyer_loi",      label:"LOI Acknowledgment"    },
    { id:"buyer_contract", label:"Contract Update"       },
  ]

  const draft_email = async () => {
    setLoading(true); setDraft("")
    const name = dealType==="seller" ? deal.firstName+" "+deal.lastName : deal.buyerName
    const prop = dealType==="seller" ? deal.address : deal.listingName
    const price= dealType==="seller" ? fmt(deal.askingPrice) : fmt(deal.offerPrice)
    const prompt = [
      "You are a licensed business broker at Veribas Real Estate LLC drafting a professional email.",
      "Broker: "+user.name+" | Company: Veribas Real Estate LLC",
      "Email type: "+emailType,
      "Recipient name: "+name,
      "Property/deal: "+prop,
      "Price: "+price,
      dealType==="buyer" ? "Note: Buyer pays 5% broker fee. Veribas represents buyer as client." : "Note: Veribas represents seller as customer (limited agency).",
      "",
      "Write a professional, warm, concise email (3-4 short paragraphs). Include subject line.",
      "Format: Subject: [subject]\n\n[body]",
      "Sign off with the broker's name and Veribas Real Estate LLC contact info.",
    ].join("\n")
    try {
      const apiKey = import.meta.env.VITE_ANTHROPIC_API_KEY
      if (!apiKey) { setDraft("API key not configured. Add VITE_ANTHROPIC_API_KEY in Vercel environment variables."); setLoading(false); return }
      const res = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{
          "Content-Type":"application/json",
          "x-api-key": apiKey,
          "anthropic-version":"2023-06-01",
          "anthropic-dangerous-direct-browser-access":"true"
        },
        body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:600,messages:[{role:"user",content:prompt}]})
      })
      const data = await res.json()
      if (data.error) { setDraft("API error: " + data.error.message); setLoading(false); return }
      setDraft(data.content?.[0]?.text || "Unable to generate draft.")
    } catch(e) { setDraft("Error: " + e.message) }
    setLoading(false)
  }

  return (
    <div style={{marginTop:20}}>
      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.cyan,marginBottom:12}}>🤖 AI Email Drafter</div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:12}}>
        {EMAIL_TYPES.map(t=>(
          <button key={t.id} onClick={()=>setEmailType(t.id)}
            style={{background:emailType===t.id?C.blue:"transparent",color:emailType===t.id?"#fff":C.white2,border:`1px solid ${emailType===t.id?C.blue:C.border}`,borderRadius:6,padding:"5px 12px",fontFamily:"'Outfit',sans-serif",fontSize:12,cursor:"pointer",transition:"all 0.15s"}}>
            {t.label}
          </button>
        ))}
      </div>
      <button onClick={draft_email} disabled={loading}
        style={{background:C.blue,color:"#fff",border:"none",borderRadius:6,padding:"9px 18px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",marginBottom:12,opacity:loading?0.6:1}}>
        {loading?"Drafting…":"Generate Draft →"}
      </button>
      {draft && (
        <div style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:16}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>Draft — click to copy</span>
            <button onClick={()=>navigator.clipboard.writeText(draft)}
              style={{background:C.blueBg,border:`1px solid ${C.blueBd}`,color:C.blue,borderRadius:5,padding:"4px 10px",fontFamily:"'Outfit',sans-serif",fontSize:11,cursor:"pointer"}}>Copy</button>
          </div>
          <pre style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.white2,lineHeight:1.7,whiteSpace:"pre-wrap",margin:0}}>{draft}</pre>
        </div>
      )}
    </div>
  )
}

// ─── DEAL DETAIL MODAL ────────────────────────────────────────────────────────
function DealDetail({deal, dealType, onClose, currentUser, users, onUpdate}) {
  const [tab, setTab]         = useState("info")
  const [status, setStatus]   = useState(deal.status)
  const [assigned, setAssigned] = useState(deal.assignedTo)
  const [note, setNote]       = useState("")
  const [notes, setNotes]     = useState(deal.notes ? [{text:deal.notes,author:"System",ts:deal.ts}] : [])
  const isMobile              = useWidth() < 640
  const isAdmin               = currentUser.role === "admin"

  const statusOpts = dealType==="seller"
    ? ["New","Contacted","Qualified","NDA Signed","Offer Submitted","Under Contract","Due Diligence","Closed","Dead"]
    : ["New","Under Review","Negotiating","Under Contract","Due Diligence","Closed","Dead"]

  const inpStyle = {width:"100%",fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.white,background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 12px",outline:"none",boxSizing:"border-box"}

  useEffect(()=>{ document.body.style.overflow="hidden"; return()=>{document.body.style.overflow=""} },[])

  const commissionLine = dealType==="buyer" ? (
    <div style={{background:`${C.green}10`,border:`1px solid ${C.green}25`,borderRadius:8,padding:"10px 14px",marginBottom:14}}>
      <div style={{display:"flex",justifyContent:"space-between"}}>
        <span style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.green,fontWeight:700}}>💰 Veribas Commission (5%)</span>
        <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:15,fontWeight:700,color:C.green}}>{fmt(deal.brokerFee)}</span>
      </div>
      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted,marginTop:3}}>Paid by buyer · Offer price: {fmt(deal.offerPrice)} · Total buyer cost: {fmt(deal.offerPrice+deal.brokerFee)}</div>
    </div>
  ) : null

  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.75)",zIndex:1000,display:"flex",alignItems:isMobile?"flex-end":"center",justifyContent:"center",padding:isMobile?"0":"20px"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose()}}>
      <div style={{background:C.card,border:`1px solid ${C.borderLt}`,borderRadius:isMobile?"16px 16px 0 0":"14px",width:"100%",maxWidth:660,maxHeight:isMobile?"92vh":"88vh",display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Header */}
        <div style={{background:C.surface,padding:"18px 20px",borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12}}>
            <div>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.white,marginBottom:4}}>
                {dealType==="seller" ? deal.firstName+" "+deal.lastName : deal.buyerName}
              </div>
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white2}}>
                {dealType==="seller" ? deal.address : deal.listingName+" · "+deal.portal}
              </div>
              <div style={{display:"flex",gap:8,marginTop:8,flexWrap:"wrap",alignItems:"center"}}>
                <StatusBadge status={status}/>
                {dealType==="seller"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:C.amber}}>{fmtK(deal.askingPrice)}</span>}
                {dealType==="buyer"&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:C.green}}>{fmtK(deal.offerPrice)} offer</span>}
                <span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{fmtDate(deal.ts)}</span>
              </div>
            </div>
            <button onClick={onClose} style={{background:`${C.white}10`,border:"none",color:C.white2,borderRadius:"50%",width:30,height:30,cursor:"pointer",fontSize:15,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>✕</button>
          </div>
        </div>
        {/* Tabs */}
        <div style={{display:"flex",background:C.surface,borderBottom:`1px solid ${C.border}`,flexShrink:0}}>
          {[["info","📋 Info"],["activity","📝 Notes"],["email","✉️ Email"]].map(([k,l])=>(
            <button key={k} onClick={()=>setTab(k)} style={{flex:1,padding:"10px 6px",border:"none",background:"none",cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:tab===k?700:400,color:tab===k?C.blue:C.muted,borderBottom:tab===k?`2px solid ${C.blue}`:"2px solid transparent"}}>
              {l}
            </button>
          ))}
        </div>
        {/* Content */}
        <div style={{flex:1,overflowY:"auto",padding:"18px 20px 24px"}}>
          {tab==="info" && (
            <div>
              {commissionLine}
              {/* Contact */}
              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:10}}>Contact</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
                {[
                  dealType==="seller"?["Name",deal.firstName+" "+deal.lastName]:["Buyer",deal.buyerName],
                  dealType==="seller"?["Phone",deal.phone]:["Phone",deal.buyerPhone],
                  dealType==="seller"?["Email",deal.email]:["Email",deal.buyerEmail],
                  dealType==="buyer"&&["Entity",deal.buyerEntity],
                  dealType==="seller"?["Property",deal.address]:["Listing",deal.listingName],
                  dealType==="seller"?["Details",deal.details]:["Financing",deal.financing],
                  dealType==="seller"?["Ask Price",fmt(deal.askingPrice)]:["Offer Price",fmt(deal.offerPrice)],
                  dealType==="seller"?["Reason",deal.reason]:["Structure",deal.structure],
                  dealType==="buyer"&&["DD Period",deal.ddPeriod],
                  ["Source",dealType==="seller"?deal.site:deal.portal],
                ].filter(Boolean).map(([k,v])=>(
                  <div key={k} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 12px"}}>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:9,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:2}}>{k}</div>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,color:C.white}}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Status + Assignment (admin or processor for assigned deals) */}
              {(isAdmin || deal.assignedTo===currentUser.id) && (
                <div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:10}}>Manage</div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
                    <div>
                      <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Status</label>
                      <select value={status} onChange={e=>{setStatus(e.target.value);onUpdate(deal.id,dealType,{status:e.target.value})}}
                        style={{...inpStyle,cursor:"pointer"}}>
                        {statusOpts.map(s=><option key={s} value={s} style={{background:C.surface}}>{s}</option>)}
                      </select>
                    </div>
                    {isAdmin && (
                      <div>
                        <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,color:C.muted,textTransform:"uppercase",letterSpacing:"0.08em",marginBottom:5}}>Assigned To</label>
                        <select value={assigned||""} onChange={e=>{const v=e.target.value?Number(e.target.value):null;setAssigned(v);onUpdate(deal.id,dealType,{assignedTo:v})}}
                          style={{...inpStyle,cursor:"pointer"}}>
                          <option value="" style={{background:C.surface}}>Unassigned</option>
                          {users.filter(u=>u.role==="processor").map(u=><option key={u.id} value={u.id} style={{background:C.surface}}>{u.name}</option>)}
                        </select>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
          {tab==="activity" && (
            <div>
              <div style={{display:"flex",flexDirection:"column",gap:10,marginBottom:20}}>
                {notes.length===0 && <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.muted,textAlign:"center",padding:"24px 0"}}>No notes yet</div>}
                {notes.map((n,i)=>(
                  <div key={i} style={{background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"12px 14px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:C.blue}}>{n.author}</span>
                      <span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{fmtDate(n.ts)}</span>
                    </div>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.white2,lineHeight:1.6}}>{n.text}</div>
                  </div>
                ))}
              </div>
              <div>
                <textarea placeholder="Add a note…" value={note} onChange={e=>setNote(e.target.value)}
                  style={{...inpStyle,resize:"none",height:80,marginBottom:10}}
                  onFocus={e=>{e.target.style.borderColor=C.blue}}
                  onBlur={e=>{e.target.style.borderColor=C.border}}/>
                <button onClick={()=>{if(!note.trim())return;setNotes(p=>[...p,{text:note,author:currentUser.name,ts:new Date().toISOString()}]);setNote("")}}
                  style={{background:C.blue,color:"#fff",border:"none",borderRadius:6,padding:"9px 20px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>
                  Add Note
                </button>
              </div>
            </div>
          )}
          {tab==="email" && <EmailDrafter deal={deal} dealType={dealType} user={currentUser}/>}
        </div>
      </div>
    </div>
  )
}

// ─── PIPELINE VIEW ────────────────────────────────────────────────────────────
function Pipeline({sellerLeads, buyerDeals, onSelectDeal, currentUser}) {
  const stages = ["New","Contacted / Under Review","Qualified / Negotiating","NDA Signed","Offer Submitted","Under Contract","Due Diligence","Closed"]
  const normalize = s => {
    if(s==="Contacted"||s==="Under Review")    return "Contacted / Under Review"
    if(s==="Qualified"||s==="Negotiating")      return "Qualified / Negotiating"
    return s
  }
  const all = [
    ...sellerLeads.filter(d=>d.status!=="Dead").map(d=>({...d,_type:"seller",_label:d.firstName+" "+d.lastName,_price:d.askingPrice})),
    ...buyerDeals.filter(d=>d.status!=="Dead").map(d=>({...d,_type:"buyer",_label:d.buyerName,_price:d.offerPrice})),
  ].filter(d => currentUser.role==="admin" || d.assignedTo===currentUser.id)

  return (
    <div style={{overflowX:"auto",paddingBottom:16}}>
      <div style={{display:"flex",gap:10,minWidth:900}}>
        {stages.map(stage=>{
          const items = all.filter(d=>normalize(d.status)===stage)
          const stageVal = items.reduce((s,d)=>s+d._price,0)
          return (
            <div key={stage} style={{flex:1,minWidth:150,background:C.surface,border:`1px solid ${C.border}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{padding:"10px 12px",borderBottom:`1px solid ${C.border}`,background:C.card}}>
                <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.09em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>{stage}</div>
                <div style={{display:"flex",justifyContent:"space-between"}}>
                  <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:C.white}}>{items.length}</span>
                  {stageVal>0&&<span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:C.green}}>{fmtK(stageVal)}</span>}
                </div>
              </div>
              <div style={{padding:8,display:"flex",flexDirection:"column",gap:6,maxHeight:400,overflowY:"auto"}}>
                {items.map(d=>(
                  <div key={d.id+d._type} onClick={()=>onSelectDeal(d,d._type)}
                    style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"9px 10px",cursor:"pointer",transition:"border-color 0.15s"}}
                    onMouseEnter={e=>e.currentTarget.style.borderColor=C.blue}
                    onMouseLeave={e=>e.currentTarget.style.borderColor=C.border}>
                    <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,fontWeight:600,color:C.white,marginBottom:3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d._label}</div>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:10,color:C.green}}>{fmtK(d._price)}</span>
                      <span style={{fontSize:12}}>{d._type==="seller"?"📤":"📥"}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── TEAM PAGE (admin only) ───────────────────────────────────────────────────
function TeamPage({users, setUsers, sellerLeads, buyerDeals, currentUser}) {
  const [showAdd, setShowAdd]     = useState(false)
  const [editUser, setEditUser]   = useState(null)
  const [confirm, setConfirm]     = useState(null)
  const [newUser, setNewUser]     = useState({name:"",email:"",role:"processor",password:""})
  const [editForm, setEditForm]   = useState({})
  const [msg, setMsg]             = useState("")

  const inpStyle = {width:"100%",fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.white,background:C.surface,border:"1px solid "+C.border,borderRadius:6,padding:"9px 12px",outline:"none",boxSizing:"border-box"}

  const getInitials = name => name.split(" ").map(w=>w[0]).join("").toUpperCase().slice(0,2)

  const flash = m => { setMsg(m); setTimeout(()=>setMsg(""),3000) }

  const addUser = () => {
    if (!newUser.name || !newUser.email || !newUser.password) { flash("All fields required."); return }
    if (users.find(u=>u.email.toLowerCase()===newUser.email.toLowerCase())) { flash("Email already exists."); return }
    const id = Math.max(...users.map(u=>u.id)) + 1
    setUsers(p=>[...p,{...newUser,id,initials:getInitials(newUser.name)}])
    setNewUser({name:"",email:"",role:"processor",password:""})
    setShowAdd(false)
    flash("User added successfully.")
  }

  const saveEdit = () => {
    if (!editForm.name || !editForm.email) { flash("Name and email required."); return }
    setUsers(p=>p.map(u=>u.id===editUser.id?{...u,...editForm,initials:getInitials(editForm.name)}:u))
    setEditUser(null)
    flash("User updated successfully.")
  }

  const removeUser = id => {
    if (id===currentUser.id) { flash("You cannot remove your own account."); return }
    setUsers(p=>p.filter(u=>u.id!==id))
    setConfirm(null)
    flash("User removed.")
  }

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:12}}>
        <div style={{fontFamily:"'Syne',sans-serif",fontSize:20,fontWeight:700,color:C.white}}>Team Management</div>
        <button onClick={()=>setShowAdd(true)}
          style={{background:C.blue,color:"#fff",border:"none",borderRadius:7,padding:"9px 18px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",display:"flex",alignItems:"center",gap:6}}>
          + Add User
        </button>
      </div>

      {msg && <div style={{background:C.green+"20",border:"1px solid "+C.green+"40",borderRadius:7,padding:"10px 14px",fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.green,marginBottom:16}}>{msg}</div>}

      {/* ADD USER FORM */}
      {showAdd && (
        <Card style={{padding:"20px 22px",marginBottom:16}}>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.white,marginBottom:16}}>Add New User</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>Full Name</label>
              <input placeholder="Jane Smith" value={newUser.name} onChange={e=>setNewUser(p=>({...p,name:e.target.value}))} style={inpStyle} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>Email</label>
              <input placeholder="jane@veribas.com" value={newUser.email} onChange={e=>setNewUser(p=>({...p,email:e.target.value}))} style={inpStyle} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>Password</label>
              <input placeholder="Set a password" value={newUser.password} onChange={e=>setNewUser(p=>({...p,password:e.target.value}))} style={inpStyle} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
            </div>
            <div>
              <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>Role</label>
              <select value={newUser.role} onChange={e=>setNewUser(p=>({...p,role:e.target.value}))} style={{...inpStyle,cursor:"pointer"}}>
                <option value="processor" style={{background:C.surface}}>Deal Processor</option>
                <option value="admin" style={{background:C.surface}}>Admin</option>
              </select>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={addUser} style={{background:C.blue,color:"#fff",border:"none",borderRadius:6,padding:"9px 20px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer"}}>Create User</button>
            <button onClick={()=>setShowAdd(false)} style={{background:"transparent",color:C.white2,border:"1px solid "+C.border,borderRadius:6,padding:"9px 18px",fontFamily:"'Outfit',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button>
          </div>
        </Card>
      )}

      {/* EDIT USER MODAL */}
      {editUser && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.card,border:"1px solid "+C.borderLt,borderRadius:14,width:"100%",maxWidth:440,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.5)"}}>
            <div style={{background:C.surface,padding:"18px 22px",borderBottom:"1px solid "+C.border,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.white}}>Edit User</div>
              <button onClick={()=>setEditUser(null)} style={{background:"none",border:"none",color:C.white2,cursor:"pointer",fontSize:18}}>✕</button>
            </div>
            <div style={{padding:"20px 22px 24px",display:"flex",flexDirection:"column",gap:12}}>
              {[["Full Name","name","Jane Smith"],["Email","email","jane@veribas.com"],["New Password","password","Leave blank to keep current"]].map(([label,key,ph])=>(
                <div key={key}>
                  <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>{label}</label>
                  <input type={key==="password"?"password":"text"} placeholder={ph} value={editForm[key]||""} onChange={e=>setEditForm(p=>({...p,[key]:e.target.value}))} style={inpStyle} onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
                </div>
              ))}
              <div>
                <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.08em",textTransform:"uppercase",color:C.muted,marginBottom:4}}>Role</label>
                <select value={editForm.role||"processor"} onChange={e=>setEditForm(p=>({...p,role:e.target.value}))} style={{...inpStyle,cursor:"pointer"}} disabled={editUser.id===currentUser.id}>
                  <option value="processor" style={{background:C.surface}}>Deal Processor</option>
                  <option value="admin" style={{background:C.surface}}>Admin</option>
                </select>
                {editUser.id===currentUser.id && <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted,marginTop:4}}>You cannot change your own role.</div>}
              </div>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={saveEdit} style={{background:C.blue,color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",flex:1}}>Save Changes</button>
                <button onClick={()=>setEditUser(null)} style={{background:"transparent",color:C.white2,border:"1px solid "+C.border,borderRadius:6,padding:"10px 16px",fontFamily:"'Outfit',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE */}
      {confirm && (
        <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.7)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div style={{background:C.card,border:"1px solid "+C.borderLt,borderRadius:14,width:"100%",maxWidth:380,padding:"28px 28px 24px",boxShadow:"0 40px 100px rgba(0,0,0,0.5)"}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:17,fontWeight:700,color:C.white,marginBottom:8}}>Remove User?</div>
            <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,color:C.white2,marginBottom:20,lineHeight:1.6}}>Are you sure you want to remove <strong style={{color:C.white}}>{confirm.name}</strong>? This cannot be undone.</div>
            <div style={{display:"flex",gap:8}}>
              <button onClick={()=>removeUser(confirm.id)} style={{background:C.red,color:"#fff",border:"none",borderRadius:6,padding:"10px 20px",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,cursor:"pointer",flex:1}}>Yes, Remove</button>
              <button onClick={()=>setConfirm(null)} style={{background:"transparent",color:C.white2,border:"1px solid "+C.border,borderRadius:6,padding:"10px 16px",fontFamily:"'Outfit',sans-serif",fontSize:13,cursor:"pointer"}}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* USER CARDS */}
      <div style={{display:"grid",gap:12}}>
        {users.filter(u=>u.id!==currentUser.id).map(u=>{
          const sl = sellerLeads.filter(d=>d.assignedTo===u.id)
          const bd = buyerDeals.filter(d=>d.assignedTo===u.id)
          const commission = bd.filter(d=>d.status==="Closed").reduce((s,d)=>s+d.brokerFee,0)
          return (
            <Card key={u.id} style={{padding:"20px 22px"}}>
              <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
                <Avatar name={u.name} initials={u.initials} size={48} color={u.role==="admin"?C.purple:C.blue}/>
                <div style={{flex:1}}>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:16,fontWeight:700,color:C.white}}>{u.name}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white2}}>{u.email}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:u.role==="admin"?C.purple:C.blue,marginTop:2,textTransform:"capitalize",letterSpacing:"0.05em"}}>{u.role==="admin"?"Admin":"Deal Processor"}</div>
                </div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,textAlign:"center"}}>
                  {[["Seller Leads",sl.length,C.amber],["Buyer Deals",bd.length,C.cyan],["Commission",fmt(commission),C.green]].map(([k,v,col])=>(
                    <div key={k}>
                      <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:18,fontWeight:700,color:col}}>{v}</div>
                      <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:"0.07em",marginTop:2}}>{k}</div>
                    </div>
                  ))}
                </div>
                <div style={{display:"flex",gap:6,flexShrink:0}}>
                  <button onClick={()=>{setEditUser(u);setEditForm({name:u.name,email:u.email,role:u.role,password:""})}}
                    style={{background:C.blueBg,border:"1px solid "+C.blueBd,color:C.blue,borderRadius:6,padding:"7px 14px",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    Edit
                  </button>
                  <button onClick={()=>setConfirm(u)}
                    style={{background:"rgba(239,68,68,0.1)",border:"1px solid rgba(239,68,68,0.25)",color:C.red,borderRadius:6,padding:"7px 14px",fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,cursor:"pointer"}}>
                    Remove
                  </button>
                </div>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function VeribasAdmin() {
  const width     = useWidth()
  const isMobile  = width < 768

  const [currentUser, setCurrentUser]   = useState(null)
  const [loginForm, setLoginForm]       = useState({email:"",password:""})
  const [loginError, setLoginError]     = useState("")
  const [view, setView]                 = useState("dashboard")
  const [users, setUsers]               = useState(USERS_DB)
  const [sellerLeads, setSellerLeads]   = useState([])
  const [buyerDeals, setBuyerDeals]     = useState([])
  const [dbLoading, setDbLoading]       = useState(true)

  // ── Load + poll Supabase every 20s ──────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [leads, deals] = await Promise.all([
          sb("seller_leads?select=*&order=created_at.desc"),
          sb("buyer_deals?select=*&order=created_at.desc")
        ])
        if (leads) setSellerLeads(leads.map(normalizeLead))
        if (deals) setBuyerDeals(deals.map(normalizeDeal))
      } catch(e) { console.error("Supabase load error:", e) }
      setDbLoading(false)
    }
    load()
    const interval = setInterval(load, 20000)
    return () => clearInterval(interval)
  }, [])
  // ─────────────────────────────────────────────────────────────────────────────

  const [selectedDeal, setSelectedDeal] = useState(null)
  const [selectedType, setSelectedType] = useState(null)
  const [sidebarOpen, setSidebarOpen]   = useState(!isMobile)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterSite, setFilterSite]     = useState("")

  const handleUpdate = useCallback(async (id, type, changes) => {
    // Optimistic update
    if (type==="seller") setSellerLeads(p=>p.map(d=>d.id===id?{...d,...changes}:d))
    else setBuyerDeals(p=>p.map(d=>d.id===id?{...d,...changes}:d))
    // Persist to Supabase
    const table = type==="seller" ? "seller_leads" : "buyer_deals"
    const patch = {}
    if (changes.status !== undefined) patch.status = changes.status
    if (changes.assignedTo !== undefined) patch.assigned_to = changes.assignedTo
    if (changes.notesArr !== undefined) patch.notes = JSON.stringify(changes.notesArr)
    if (Object.keys(patch).length > 0) {
      try { await sb(table+"?id=eq."+id, {method:"PATCH", body:patch}) }
      catch(e) { console.error("Supabase update error:", e) }
    }
  },[])

  const handleLogin = () => {
    const u = users.find(u=>u.email.toLowerCase()===loginForm.email.toLowerCase()&&u.password===loginForm.password)
    if (u) { setCurrentUser(u); setLoginError("") }
    else setLoginError("Invalid email or password.")
  }

  // Computed stats
  const myLeads  = (currentUser?.role==="admin" ? sellerLeads : sellerLeads.filter(d=>d.assignedTo===currentUser?.id))
  const myDeals  = currentUser?.role==="admin" ? buyerDeals  : buyerDeals.filter(d=>d.assignedTo===currentUser?.id)
  const pipeline = [...sellerLeads,...buyerDeals].filter(d=>!["Closed","Dead"].includes(d.status))
  const totalCommission = buyerDeals.filter(d=>d.status==="Closed").reduce((s,d)=>s+d.brokerFee,0)
  const pipelineValue   = myDeals.filter(d=>!["Closed","Dead"].includes(d.status)).reduce((s,d)=>s+d.offerPrice,0)

  const inpStyle = {width:"100%",fontFamily:"'Outfit',sans-serif",fontSize:14,color:C.white,background:C.surface,border:`1px solid ${C.border}`,borderRadius:8,padding:"11px 14px",outline:"none",boxSizing:"border-box"}

  // ── LOGIN SCREEN ──
  if (!currentUser) return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>
      <div style={{background:C.card,border:`1px solid ${C.borderLt}`,borderRadius:16,width:"100%",maxWidth:420,overflow:"hidden",boxShadow:"0 40px 100px rgba(0,0,0,0.5)"}}>
        <div style={{background:C.surface,padding:"32px 32px 28px",textAlign:"center",borderBottom:`1px solid ${C.border}`}}>
          <div style={{width:56,height:56,borderRadius:12,background:`${C.blue}20`,border:`1px solid ${C.blue}30`,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:24}}>🏢</div>
          <div style={{fontFamily:"'Syne',sans-serif",fontSize:22,fontWeight:700,color:C.white,marginBottom:4}}>Veribas Admin</div>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.muted}}>Veribas Real Estate LLC · Internal Portal</div>
        </div>
        <div style={{padding:"28px 32px 32px"}}>
          <div style={{marginBottom:12}}>
            <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:5}}>Email</label>
            <input type="email" placeholder="you@veribas.com" value={loginForm.email} onChange={e=>setLoginForm(p=>({...p,email:e.target.value}))}
              style={inpStyle} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontFamily:"'Outfit',sans-serif",fontSize:10,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,marginBottom:5}}>Password</label>
            <input type="password" placeholder="••••••••" value={loginForm.password} onChange={e=>setLoginForm(p=>({...p,password:e.target.value}))}
              style={inpStyle} onKeyDown={e=>e.key==="Enter"&&handleLogin()}
              onFocus={e=>e.target.style.borderColor=C.blue} onBlur={e=>e.target.style.borderColor=C.border}/>
          </div>
          {loginError && <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.red,marginBottom:12,textAlign:"center"}}>{loginError}</div>}
          <button onClick={handleLogin} style={{width:"100%",background:C.blue,color:"#fff",border:"none",borderRadius:8,padding:"13px",fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,cursor:"pointer",letterSpacing:"0.04em"}}
            onMouseEnter={e=>e.target.style.background=C.blueDk} onMouseLeave={e=>e.target.style.background=C.blue}>
            Sign In →
          </button>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted,textAlign:"center",marginTop:16}}>
            Admin: ahsan@veribas.com / admin123<br/>
            Processor: sarah@veribas.com / proc123
          </div>
        </div>
      </div>
    </div>
  )

  const NAV = [
    {id:"dashboard",icon:"📊",label:"Dashboard"},
    {id:"sellers",  icon:"📤",label:"Seller Leads"},
    {id:"buyers",   icon:"📥",label:"Buyer Deals"},
    {id:"pipeline", icon:"🔀",label:"Pipeline"},
    ...(currentUser.role==="admin"?[{id:"team",icon:"👥",label:"Team"}]:[]),
  ]

  const SIDEBAR_W = 220

  return (
    <div style={{fontFamily:"'Outfit',sans-serif",background:C.bg,minHeight:"100vh",color:C.white,display:"flex"}}>
      <link href="https://fonts.googleapis.com/css2?family=Syne:wght@600;700;800&family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet"/>

      {/* SIDEBAR */}
      {(!isMobile || sidebarOpen) && (
        <>
          {isMobile && <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:99}} onClick={()=>setSidebarOpen(false)}/>}
          <div style={{width:SIDEBAR_W,background:C.surface,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",position:isMobile?"fixed":"sticky",top:0,left:0,height:"100vh",zIndex:100,flexShrink:0}}>
            {/* Logo */}
            <div style={{padding:"20px 20px 16px",borderBottom:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <div style={{width:32,height:32,borderRadius:6,background:`${C.blue}20`,border:`1px solid ${C.blue}30`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏢</div>
                <div>
                  <div style={{fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:C.white,lineHeight:1}}>Veribas</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,color:C.muted}}>Admin Portal</div>
                </div>
              </div>
            </div>
            {/* Nav */}
            <nav style={{flex:1,padding:"12px 10px",overflow:"auto"}}>
              {NAV.map(n=>(
                <button key={n.id} onClick={()=>{setView(n.id);if(isMobile)setSidebarOpen(false)}}
                  style={{width:"100%",display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:7,border:"none",background:view===n.id?`${C.blue}15`:"transparent",color:view===n.id?C.blue:C.white2,cursor:"pointer",fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:view===n.id?600:400,marginBottom:2,textAlign:"left",transition:"all 0.15s"}}>
                  <span style={{fontSize:16}}>{n.icon}</span>{n.label}
                </button>
              ))}
            </nav>
            {/* User */}
            <div style={{padding:"14px 16px",borderTop:`1px solid ${C.border}`}}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar name={currentUser.name} initials={currentUser.initials} size={32}/>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:12,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{currentUser.name}</div>
                  <div style={{fontFamily:"'Outfit',sans-serif",fontSize:10,color:C.blue,textTransform:"capitalize"}}>{currentUser.role}</div>
                </div>
                <button onClick={()=>setCurrentUser(null)} style={{background:"none",border:"none",color:C.muted,cursor:"pointer",fontSize:16,padding:4}} title="Sign out">↩</button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* MAIN */}
      <div style={{flex:1,minWidth:0,display:"flex",flexDirection:"column"}}>
        {/* Top bar */}
        <div style={{background:C.surface,borderBottom:`1px solid ${C.border}`,padding:"0 20px",height:54,display:"flex",alignItems:"center",gap:12,flexShrink:0,position:"sticky",top:0,zIndex:50}}>
          {isMobile && <button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",color:C.white2,cursor:"pointer",fontSize:20,padding:4}}>☰</button>}
          <div style={{flex:1}}>
            <div style={{fontFamily:"'Syne',sans-serif",fontSize:15,fontWeight:700,color:C.white}}>{NAV.find(n=>n.id===view)?.label}</div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:8}}><div style={{width:7,height:7,borderRadius:"50%",background:dbLoading?C.amber:C.green,animation:dbLoading?"none":"pulse 2s ease infinite"}}></div><div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:11,color:dbLoading?C.amber:C.green,fontWeight:600}}>{dbLoading?"Loading...":fmt(totalCommission)+" earned"}</div></div><style>{"@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}"}</style>
          <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>Veribas Real Estate LLC</div>
        </div>

        {/* Page content */}
        <div style={{flex:1,overflowY:"auto",padding:isMobile?"14px":"24px"}}>

          {/* DASHBOARD */}
          {view==="dashboard" && (
            <div>
              <div style={{display:"grid",gridTemplateColumns:`repeat(${isMobile?2:4},1fr)`,gap:12,marginBottom:20}}>
                <MetricCard label="Seller Leads"      value={myLeads.length}            sub={myLeads.filter(d=>d.status==="New").length+" new"} icon="📤" color={C.amber}/>
                <MetricCard label="Buyer Deals"       value={myDeals.length}            sub={myDeals.filter(d=>d.status==="New").length+" new"} icon="📥" color={C.cyan}/>
                <MetricCard label="Under Contract"    value={[...myLeads,...myDeals].filter(d=>d.status==="Under Contract").length} sub="Active deals" icon="🤝" color={C.green}/>
                <MetricCard label="Commission Earned" value={fmt(totalCommission)}      sub="Closed deals (5% fee)" icon="💰" color={C.green}/>
              </div>
              <div style={{display:"grid",gridTemplateColumns:isMobile?"1fr":"1fr 1fr",gap:12,marginBottom:20}}>
                <MetricCard label="Pipeline Value"    value={fmtK(pipelineValue)} sub="Buyer deals in progress" color={C.blue}/>
                <MetricCard label="Projected Commission" value={fmtK(pipelineValue*0.05)} sub="5% of active pipeline" color={C.purple}/>
              </div>
              {/* Recent activity */}
              <Card style={{padding:0,overflow:"hidden"}}>
                <div style={{padding:"14px 18px",borderBottom:`1px solid ${C.border}`,fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:700,color:C.white}}>Recent Activity</div>
                {[...myLeads,...myDeals].sort((a,b)=>new Date(b.ts)-new Date(a.ts)).slice(0,6).map((d,i)=>{
                  const isSeller = "firstName" in d
                  return (
                    <div key={i} onClick={()=>{setSelectedDeal(d);setSelectedType(isSeller?"seller":"buyer")}}
                      style={{padding:"12px 18px",borderBottom:`1px solid ${C.border}`,cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"background 0.15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=C.cardHv}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{fontSize:20,flexShrink:0}}>{isSeller?d.icon:"📥"}</span>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:13,fontWeight:600,color:C.white,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{isSeller?d.firstName+" "+d.lastName:d.buyerName}</div>
                        <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{isSeller?d.site:d.portal} · {fmtDate(d.ts)}</div>
                      </div>
                      <div style={{textAlign:"right",flexShrink:0}}>
                        <div style={{fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:isSeller?C.amber:C.green}}>{fmtK(isSeller?d.askingPrice:d.offerPrice)}</div>
                        <StatusBadge status={d.status}/>
                      </div>
                    </div>
                  )
                })}
              </Card>
            </div>
          )}

          {/* SELLER LEADS */}
          {view==="sellers" && (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white,background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 12px",outline:"none",cursor:"pointer"}}>
                  <option value="" style={{background:C.surface}}>All Statuses</option>
                  {["New","Contacted","Qualified","NDA Signed","Offer Submitted","Under Contract","Closed","Dead"].map(s=><option key={s} value={s} style={{background:C.surface}}>{s}</option>)}
                </select>
                <select value={filterSite} onChange={e=>setFilterSite(e.target.value)} style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white,background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 12px",outline:"none",cursor:"pointer"}}>
                  <option value="" style={{background:C.surface}}>All Sites</option>
                  {["GasStationCashOffer.com","WebuyCStores.com","SellMySmokeShop.com","WeBuyLiquorStores.com"].map(s=><option key={s} value={s} style={{background:C.surface}}>{s}</option>)}
                </select>
              </div>
              <Card style={{overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:600}}>
                    <thead>
                      <tr style={{background:C.surface,borderBottom:`1px solid ${C.border}`}}>
                        {["Seller","Type","Site","Ask Price","Status","Assigned","Date",""].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontFamily:"'Outfit',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myLeads.filter(d=>(currentUser.role==="admin"||d.assignedTo===currentUser.id)).filter(d=>(!filterStatus||d.status===filterStatus)&&(!filterSite||d.site===filterSite)).map(d=>{
                        const assignee = users.find(u=>u.id===d.assignedTo)
                        return (
                          <tr key={d.id} onClick={()=>{setSelectedDeal(d);setSelectedType("seller")}}
                            style={{cursor:"pointer",borderBottom:`1px solid ${C.border}`,transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=C.cardHv}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{padding:"12px 14px"}}>
                              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:C.white}}>{d.firstName} {d.lastName}</div>
                              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{d.phone}</div>
                            </td>
                            <td style={{padding:"12px 8px"}}><span style={{fontSize:18}}>{d.icon}</span></td>
                            <td style={{padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.white2}}>{d.site.replace(".com","")}</td>
                            <td style={{padding:"12px 8px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:C.amber}}>{fmtK(d.askingPrice)}</td>
                            <td style={{padding:"12px 8px"}}><StatusBadge status={d.status}/></td>
                            <td style={{padding:"12px 8px"}}>{assignee?<div style={{display:"flex",alignItems:"center",gap:6}}><Avatar name={assignee.name} initials={assignee.initials} size={22}/><span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.white2}}>{assignee.name.split(" ")[0]}</span></div>:<span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>Unassigned</span>}</td>
                            <td style={{padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{fmtDate(d.ts)}</td>
                            <td style={{padding:"12px 14px"}}><button style={{background:C.blue,color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Open</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* BUYER DEALS */}
          {view==="buyers" && (
            <div>
              <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
                <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} style={{fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white,background:C.card,border:`1px solid ${C.border}`,borderRadius:6,padding:"7px 12px",outline:"none",cursor:"pointer"}}>
                  <option value="" style={{background:C.surface}}>All Statuses</option>
                  {["New","Under Review","Negotiating","Under Contract","Due Diligence","Closed","Dead"].map(s=><option key={s} value={s} style={{background:C.surface}}>{s}</option>)}
                </select>
              </div>
              <Card style={{overflow:"hidden"}}>
                <div style={{overflowX:"auto"}}>
                  <table style={{width:"100%",borderCollapse:"collapse",minWidth:700}}>
                    <thead>
                      <tr style={{background:C.surface,borderBottom:`1px solid ${C.border}`}}>
                        {["Buyer","Listing","Portal","Offer","Fee (5%)","Status","Assigned",""].map(h=>(
                          <th key={h} style={{padding:"10px 14px",textAlign:"left",fontFamily:"'Outfit',sans-serif",fontSize:9,fontWeight:700,letterSpacing:"0.1em",textTransform:"uppercase",color:C.muted,whiteSpace:"nowrap"}}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {myDeals.filter(d=>(!filterStatus||d.status===filterStatus)).map(d=>{
                        const assignee = users.find(u=>u.id===d.assignedTo)
                        return (
                          <tr key={d.id} onClick={()=>{setSelectedDeal(d);setSelectedType("buyer")}}
                            style={{cursor:"pointer",borderBottom:`1px solid ${C.border}`,transition:"background 0.15s"}}
                            onMouseEnter={e=>e.currentTarget.style.background=C.cardHv}
                            onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                            <td style={{padding:"12px 14px"}}>
                              <div style={{fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:13,color:C.white}}>{d.buyerName}</div>
                              <div style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>{d.buyerEntity}</div>
                            </td>
                            <td style={{padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontSize:12,color:C.white2,maxWidth:160}}><div style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{d.listingName}</div></td>
                            <td style={{padding:"12px 8px",fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.white2}}>{d.portal}</td>
                            <td style={{padding:"12px 8px",fontFamily:"'JetBrains Mono',monospace",fontSize:13,fontWeight:700,color:C.green}}>{fmtK(d.offerPrice)}</td>
                            <td style={{padding:"12px 8px",fontFamily:"'JetBrains Mono',monospace",fontSize:12,fontWeight:600,color:C.green}}>{fmt(d.brokerFee)}</td>
                            <td style={{padding:"12px 8px"}}><StatusBadge status={d.status}/></td>
                            <td style={{padding:"12px 8px"}}>{assignee?<div style={{display:"flex",alignItems:"center",gap:6}}><Avatar name={assignee.name} initials={assignee.initials} size={22}/><span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.white2}}>{assignee.name.split(" ")[0]}</span></div>:<span style={{fontFamily:"'Outfit',sans-serif",fontSize:11,color:C.muted}}>Unassigned</span>}</td>
                            <td style={{padding:"12px 14px"}}><button style={{background:C.blue,color:"#fff",border:"none",borderRadius:4,padding:"4px 10px",fontSize:11,cursor:"pointer",fontFamily:"'Outfit',sans-serif"}}>Open</button></td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {view==="pipeline" && <Pipeline sellerLeads={currentUser.role==="admin"?sellerLeads:sellerLeads.filter(d=>d.assignedTo===currentUser.id)} buyerDeals={currentUser.role==="admin"?buyerDeals:buyerDeals.filter(d=>d.assignedTo===currentUser.id)} onSelectDeal={(d,t)=>{setSelectedDeal(d);setSelectedType(t)}} currentUser={currentUser}/>}

          {view==="team" && currentUser.role==="admin" && <TeamPage users={users} setUsers={setUsers} sellerLeads={sellerLeads} buyerDeals={buyerDeals} currentUser={currentUser}/>}
        </div>
      </div>

      {/* DEAL DETAIL MODAL */}
      {selectedDeal && (
        <DealDetail
          deal={selectedDeal}
          dealType={selectedType}
          onClose={()=>setSelectedDeal(null)}
          currentUser={currentUser}
          users={users}
          onUpdate={handleUpdate}
        />
      )}
    </div>
  )
}
