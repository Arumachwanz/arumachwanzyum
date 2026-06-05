/**
 * App.jsx  –  arumachwanz food rating frontend
 * Versi: terhubung ke backend API (bukan window.storage)
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import * as api from './services/api';

// ── Constants ─────────────────────────────────────────
const CATEGORIES = [
  { id: 'sarapan',     label: 'Sarapan',     emoji: '🌅' },
  { id: 'makan-siang', label: 'Makan Siang', emoji: '☀️' },
  { id: 'makan-malam', label: 'Makan Malam', emoji: '🌙' },
  { id: 'snack',       label: 'Snack',       emoji: '🍪' },
  { id: 'dessert',     label: 'Dessert',     emoji: '🍰' },
  { id: 'minuman',     label: 'Minuman',     emoji: '🧋' },
];
const FOOD_EMOJIS = [
  '🍜','🍛','🍲','🥘','🥗','🍝','🥞','🍳','🥐','🧁',
  '🍰','🍮','🎂','🥧','🍱','🥙','🌮','🌯','🥪','🍙',
  '🍚','🍤','🍗','🥩','🫕','🥣','🍣','🍩','🧆','🥨',
];
const RATING_LABELS = ['','😔 Kurang','😐 Lumayan','😊 Enak','😍 Sangat Enak','🤩 Sempurna!'];
const RATING_COLORS = ['','#E07050','#C09030','#50A870','#E05090','#FF4D8C'];

// ── CSS ────────────────────────────────────────────────
const css = `
@import url('https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@400;600;700;800&family=Dancing+Script:wght@700&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Nunito',sans-serif;}
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-thumb{background:#ffb3cc;border-radius:3px;}
input,select,textarea,button{font-family:'Nunito',sans-serif;}
@keyframes floatBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-9px)}}
@keyframes cloudDrift{0%{transform:translateX(-320px) translateY(0)}40%{transform:translateX(800px) translateY(-14px)}100%{transform:translateX(1800px) translateY(0)}}
@keyframes popIn{from{opacity:0;transform:scale(.88) translateY(18px)}to{opacity:1;transform:scale(1) translateY(0)}}
@keyframes slideUp{from{opacity:0;transform:translateY(44px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@keyframes spin{to{transform:rotate(360deg)}}
.dish-card{transition:transform .22s cubic-bezier(.34,1.56,.64,1),box-shadow .22s;}
.dish-card:hover{transform:translateY(-5px) scale(1.015);box-shadow:0 16px 40px rgba(255,77,140,.2)!important;}
.btn-pink{transition:transform .14s,box-shadow .14s;}
.btn-pink:hover{transform:scale(1.05);box-shadow:0 6px 24px rgba(255,77,140,.48)!important;}
.btn-pink:active{transform:scale(.96);}
.star-i{transition:transform .11s,color .1s;}
.star-i:hover{transform:scale(1.32)!important;}
.del-btn{opacity:0;transition:opacity .18s;}
.dish-card:hover .del-btn{opacity:1;}
.upload-zone:hover{border-color:#FF79A8!important;background:#FFF0F7!important;}
`;

// ── Image compressor ──────────────────────────────────
async function compressImg(file) {
  return new Promise((res) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const MAX = 520;
        const r = Math.min(MAX / Math.max(img.width, img.height), 1);
        const canvas = document.createElement('canvas');
        canvas.width  = Math.round(img.width  * r);
        canvas.height = Math.round(img.height * r);
        canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
        res(canvas.toDataURL('image/jpeg', 0.68));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Cloud SVG ─────────────────────────────────────────
function CloudSVG({ width, color }) {
  const h = Math.round(width * 0.58);
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ display:'block' }}>
      <ellipse cx={width*.5}  cy={h*.8}  rx={width*.44} ry={h*.28} fill={color}/>
      <circle  cx={width*.27} cy={h*.6}  r={h*.27}                 fill={color}/>
      <circle  cx={width*.5}  cy={h*.44} r={h*.21}                 fill={color}/>
      <circle  cx={width*.72} cy={h*.58} r={h*.24}                 fill={color}/>
    </svg>
  );
}
const CLOUD_CFG = [
  { w:130, top:'4%',  dur:34, delay:0,   op:.52, color:'rgba(255,225,243,.82)' },
  { w:82,  top:'18%', dur:22, delay:-9,  op:.44, color:'rgba(255,235,248,.78)' },
  { w:160, top:'34%', dur:40, delay:-17, op:.32, color:'rgba(255,220,240,.7)'  },
  { w:98,  top:'52%', dur:27, delay:-5,  op:.48, color:'rgba(255,230,246,.8)'  },
  { w:135, top:'68%', dur:36, delay:-23, op:.38, color:'rgba(255,218,238,.72)' },
  { w:68,  top:'83%', dur:20, delay:-12, op:.46, color:'rgba(255,235,249,.78)' },
];
function FloatingClouds() {
  return (
    <div style={{ position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden' }}>
      {CLOUD_CFG.map((c, i) => (
        <div key={i} style={{ position:'absolute',top:c.top,left:0,opacity:c.op,
          animation:`cloudDrift ${c.dur}s ease-in-out ${c.delay}s infinite` }}>
          <CloudSVG width={c.w} color={c.color}/>
        </div>
      ))}
    </div>
  );
}

// ── Stars ──────────────────────────────────────────────
function Stars({ rating, onRate, size=22, readOnly }) {
  const [hov, setHov] = useState(0);
  return (
    <div style={{ display:'flex',gap:2 }}>
      {[1,2,3,4,5].map(s => (
        <button key={s} className={!readOnly?'star-i':''}
          onClick={() => !readOnly && onRate?.(s)}
          onMouseEnter={() => !readOnly && setHov(s)}
          onMouseLeave={() => !readOnly && setHov(0)}
          style={{ fontSize:size,lineHeight:1,background:'none',border:'none',
            cursor:readOnly?'default':'pointer',padding:0,
            color:s<=(hov||rating)?'#FF4D8C':'#FFD0E8',
            textShadow:s<=(hov||rating)?'0 0 10px #FF4D8C44':'none' }}>★</button>
      ))}
    </div>
  );
}
function StarDisplay({ rating, size=16 }) {
  const full = Math.floor(rating);
  const half = (rating%1)>=.5;
  return (
    <span style={{ display:'inline-flex',gap:1 }}>
      {[1,2,3,4,5].map(s=>(
        <span key={s} style={{ fontSize:size,
          color:s<=full?'#FF4D8C':(s===full+1&&half?'#FF9BBB':'#FFD0E8'),
          textShadow:s<=full?'0 0 6px #FF4D8C33':'none' }}>★</span>
      ))}
    </span>
  );
}

// ── Spinner ────────────────────────────────────────────
function Spinner() {
  return (
    <div style={{ width:20,height:20,border:'3px solid #FFD0E8',borderTopColor:'#FF4D8C',
      borderRadius:'50%',animation:'spin .8s linear infinite',display:'inline-block' }}/>
  );
}

// ── Add Dish Modal ─────────────────────────────────────
function AddDishModal({ onClose, onSave }) {
  const [name,    setName]    = useState('');
  const [emoji,   setEmoji]   = useState('🍜');
  const [cat,     setCat]     = useState('makan-siang');
  const [desc,    setDesc]    = useState('');
  const [img,     setImg]     = useState(null);
  const [eoOpen,  setEoOpen]  = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [error,   setError]   = useState('');
  const fileRef = useRef();
  const ok = name.trim();

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    setImg(await compressImg(file));
    setLoading(false);
  };

  const handleSave = async () => {
    if (!ok) return;
    setSaving(true); setError('');
    try {
      const result = await api.createFood({ name:name.trim(), emoji, category:cat, description:desc.trim(), image:img });
      onSave(result.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  };

  const inp = { width:'100%',padding:'11px 14px',borderRadius:14,border:'2px solid #FFB3CC',fontSize:14,color:'#5C2A3A',outline:'none',background:'#FFF8FB' };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed',inset:0,zIndex:999,background:'rgba(255,180,210,.42)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'white',borderRadius:28,padding:'26px 24px 28px',width:'100%',maxWidth:420,border:'2px solid #FFE0EE',boxShadow:'0 20px 60px rgba(255,77,140,.18)',animation:'popIn .32s ease',maxHeight:'92vh',overflowY:'auto' }}>
        <h2 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:19,fontWeight:800,color:'#FF4D8C',textAlign:'center',marginBottom:22 }}>🍽️ Tambah Hidangan</h2>

        {/* Foto */}
        <div style={{ marginBottom:16 }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#B06080',display:'block',marginBottom:8 }}>Foto Makanan 📸</label>
          <div className="upload-zone" onClick={()=>fileRef.current?.click()} style={{ border:'2px dashed #FFB3CC',borderRadius:18,minHeight:110,cursor:'pointer',textAlign:'center',transition:'all .2s',background:'#FFF8FB',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',position:'relative' }}>
            {loading ? (
              <div style={{ display:'flex',flexDirection:'column',alignItems:'center',gap:8 }}>
                <Spinner/><span style={{ fontSize:12,color:'#C880A0',fontWeight:700 }}>Compressing...</span>
              </div>
            ) : img ? (
              <>
                <img src={img} alt="" style={{ width:'100%',maxHeight:190,objectFit:'cover',display:'block',borderRadius:14 }}/>
                <button onClick={e=>{e.stopPropagation();setImg(null);}} style={{ position:'absolute',top:8,right:8,width:28,height:28,borderRadius:'50%',border:'none',background:'rgba(255,77,140,.88)',color:'white',fontSize:16,cursor:'pointer',fontWeight:800 }}>×</button>
              </>
            ) : (
              <div style={{ padding:'18px 0' }}>
                <div style={{ fontSize:36,marginBottom:6 }}>📷</div>
                <p style={{ fontSize:13,color:'#C880A0',fontWeight:700 }}>Klik buat upload foto</p>
                <p style={{ fontSize:11,color:'#D0A0B8',marginTop:2 }}>JPG · PNG · HEIC</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} style={{ display:'none' }}/>
        </div>

        {/* Emoji */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#B06080',display:'block',marginBottom:6 }}>Emoji (jika tidak ada foto)</label>
          <button onClick={()=>setEoOpen(v=>!v)} style={{ width:'100%',padding:9,background:'#FFF0F7',border:'2px solid #FFB3CC',borderRadius:14,fontSize:30,cursor:'pointer' }}>{emoji}</button>
          {eoOpen && (
            <div style={{ display:'flex',flexWrap:'wrap',gap:6,marginTop:8,background:'#FFF0F7',borderRadius:16,padding:12,border:'1.5px solid #FFB3CC' }}>
              {FOOD_EMOJIS.map(e=>(
                <button key={e} onClick={()=>{setEmoji(e);setEoOpen(false);}} style={{ width:42,height:42,fontSize:22,cursor:'pointer',borderRadius:10,border:`1.5px solid ${emoji===e?'#FF79A8':'#FFD6E7'}`,background:emoji===e?'#FFB3CC':'white' }}>{e}</button>
              ))}
            </div>
          )}
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#B06080',display:'block',marginBottom:6 }}>Nama Hidangan *</label>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="cth: Nasi Goreng Spesial..." style={inp}/>
        </div>

        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#B06080',display:'block',marginBottom:8 }}>Kategori</label>
          <div style={{ display:'flex',flexWrap:'wrap',gap:6 }}>
            {CATEGORIES.map(c=>(
              <button key={c.id} onClick={()=>setCat(c.id)} style={{ padding:'6px 12px',borderRadius:20,cursor:'pointer',border:`2px solid ${cat===c.id?'#FF79A8':'#FFD0E8'}`,background:cat===c.id?'#FFB3CC':'white',fontSize:12,fontWeight:700,color:cat===c.id?'#5C2A3A':'#C880A0',transition:'all .13s' }}>{c.emoji} {c.label}</button>
            ))}
          </div>
        </div>

        <div style={{ marginBottom:22 }}>
          <label style={{ fontSize:12,fontWeight:700,color:'#B06080',display:'block',marginBottom:6 }}>Deskripsi (opsional)</label>
          <textarea value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Ceritain dikit tentang masakanmu..." rows={2} style={{ ...inp,resize:'none',lineHeight:1.5 }}/>
        </div>

        {error && <p style={{ fontSize:12,color:'#E05060',marginBottom:12,textAlign:'center' }}>⚠️ {error}</p>}

        <div style={{ display:'flex',gap:10 }}>
          <button onClick={onClose} style={{ flex:1,padding:12,borderRadius:50,border:'2px solid #FFB3CC',background:'white',fontSize:13,fontWeight:800,color:'#FF79A8',cursor:'pointer' }}>Batal</button>
          <button className={ok&&!saving?'btn-pink':''} onClick={handleSave} disabled={!ok||saving} style={{ flex:2,padding:12,borderRadius:50,border:'none',background:ok&&!saving?'linear-gradient(135deg,#FF85A1,#FF4D8C)':'#FFD6E7',fontSize:13,fontWeight:800,color:'white',cursor:ok&&!saving?'pointer':'not-allowed',boxShadow:ok&&!saving?'0 4px 18px rgba(255,77,140,.35)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
            {saving ? <Spinner/> : '✨ Tambah'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Review Modal ───────────────────────────────────────
function ReviewModal({ dish, onClose, onReviewAdded }) {
  const [reviews,  setReviews]  = useState([]);
  const [avg,      setAvg]      = useState(0);
  const [fetching, setFetching] = useState(true);
  const [name,     setName]     = useState('');
  const [rating,   setRating]   = useState(0);
  const [comment,  setComment]  = useState('');
  const [sending,  setSending]  = useState(false);
  const [done,     setDone]     = useState(false);
  const [error,    setError]    = useState('');

  // Load reviews
  useEffect(() => {
    (async () => {
      try {
        const res = await api.getReviewsByFood(dish._id || dish.id);
        setReviews(res.data);
        setAvg(res.avgRating);
      } catch { /* ignore */ }
      setFetching(false);
    })();
  }, [dish._id, dish.id]);

  const handleSend = async () => {
    if (!name.trim() || rating===0) return;
    setSending(true); setError('');
    try {
      const res = await api.createReview({ foodId: dish._id||dish.id, name:name.trim(), rating, comment:comment.trim() });
      setReviews(prev => [res.data, ...prev]);
      const newAvg = reviews.length ? (reviews.reduce((a,r)=>a+r.rating,0)+rating)/(reviews.length+1) : rating;
      setAvg(+newAvg.toFixed(1));
      setDone(true); setName(''); setRating(0); setComment('');
      onReviewAdded?.();
      setTimeout(()=>setDone(false), 3000);
    } catch (e) {
      setError(e.message);
    } finally {
      setSending(false);
    }
  };

  const inp = { width:'100%',padding:'11px 14px',borderRadius:14,border:'2px solid #FFB3CC',fontSize:14,color:'#5C2A3A',outline:'none',background:'#FFF8FB' };
  const dist = [5,4,3,2,1].map(s=>({ star:s, count:reviews.filter(r=>r.rating===s).length }));
  const canSend = name.trim() && rating>0;

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed',inset:0,zIndex:999,background:'rgba(255,175,205,.42)',backdropFilter:'blur(9px)',display:'flex',alignItems:'flex-end',justifyContent:'center' }}>
      <div style={{ background:'white',borderRadius:'28px 28px 0 0',padding:'24px 22px 36px',width:'100%',maxWidth:560,border:'2px solid #FFE0EE',borderBottom:'none',boxShadow:'0 -12px 50px rgba(255,77,140,.18)',animation:'slideUp .32s ease',maxHeight:'92vh',overflowY:'auto' }}>
        <div style={{ width:42,height:5,background:'#FFB3CC',borderRadius:3,margin:'0 auto 20px' }}/>

        {/* Header */}
        <div style={{ textAlign:'center',marginBottom:16,paddingBottom:16,borderBottom:'2px dashed #FFE0EE' }}>
          {dish.image ? (
            <div style={{ width:96,height:96,borderRadius:20,overflow:'hidden',margin:'0 auto 12px',border:'3px solid #FFE0EE' }}>
              <img src={dish.image} alt={dish.name} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
            </div>
          ) : (
            <div style={{ fontSize:52,lineHeight:1,marginBottom:10 }}>{dish.emoji}</div>
          )}
          <h2 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:20,fontWeight:800,color:'#5C2A3A',marginBottom:4 }}>{dish.name}</h2>
          {dish.description && <p style={{ fontSize:13,color:'#B07090',fontStyle:'italic',marginBottom:8 }}>{dish.description}</p>}
          {reviews.length>0 && (
            <div style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:10 }}>
              <StarDisplay rating={avg} size={20}/>
              <span style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:22,fontWeight:800,color:'#FF4D8C' }}>{avg}</span>
              <span style={{ fontSize:12,color:'#C880A0',fontWeight:700 }}>dari {reviews.length} orang</span>
            </div>
          )}
        </div>

        {/* Rating bar */}
        {reviews.length>0 && (
          <div style={{ marginBottom:18 }}>
            {dist.map(({star,count})=>(
              <div key={star} style={{ display:'flex',alignItems:'center',gap:8,marginBottom:5 }}>
                <span style={{ fontSize:12,fontWeight:700,color:'#C080A0',minWidth:14,textAlign:'right' }}>{star}</span>
                <span style={{ fontSize:13,color:'#FF4D8C' }}>★</span>
                <div style={{ flex:1,height:8,background:'#FFE8F2',borderRadius:4,overflow:'hidden' }}>
                  <div style={{ height:'100%',borderRadius:4,background:'linear-gradient(90deg,#FFB3CC,#FF4D8C)',width:reviews.length?`${(count/reviews.length)*100}%`:'0%',transition:'width .5s' }}/>
                </div>
                <span style={{ fontSize:12,fontWeight:700,color:'#D090B0',minWidth:16 }}>{count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Form */}
        <div style={{ background:done?'#F2FBF5':'#FFF0F7',border:`2px solid ${done?'#90D4AA':'#FFB3CC'}`,borderRadius:20,padding:'17px 16px',marginBottom:20,transition:'all .3s' }}>
          {done ? (
            <div style={{ textAlign:'center',padding:'10px 0',animation:'popIn .3s ease' }}>
              <div style={{ fontSize:46,marginBottom:8 }}>💝</div>
              <p style={{ fontWeight:800,color:'#40A070',fontSize:15 }}>Makasih udah kasih rating!</p>
              <p style={{ fontSize:12,color:'#80C0A0',marginTop:4 }}>Penilaianmu udah tersimpan~ 🌸</p>
            </div>
          ) : (
            <>
              <h3 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:15,fontWeight:800,color:'#FF4D8C',marginBottom:14 }}>⭐ Kasih Penilaianmu</h3>
              <div style={{ marginBottom:11 }}>
                <input value={name} onChange={e=>setName(e.target.value)} placeholder="Nama kamu siapa? 🌸" style={inp}/>
              </div>
              <div style={{ marginBottom:11 }}>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                  <Stars rating={rating} onRate={setRating} size={30}/>
                  {rating>0 && <span style={{ fontSize:13,fontWeight:800,color:RATING_COLORS[rating],animation:'fadeIn .2s ease' }}>{RATING_LABELS[rating]}</span>}
                </div>
              </div>
              <div style={{ marginBottom:13 }}>
                <textarea value={comment} onChange={e=>setComment(e.target.value)} placeholder="Gimana rasanya? Ada saran? (opsional)" rows={2} style={{ ...inp,resize:'none',lineHeight:1.5 }}/>
              </div>
              {error && <p style={{ fontSize:12,color:'#E05060',marginBottom:10 }}>⚠️ {error}</p>}
              <button className={canSend&&!sending?'btn-pink':''} onClick={handleSend} disabled={!canSend||sending} style={{ width:'100%',padding:12,borderRadius:50,border:'none',background:canSend&&!sending?'linear-gradient(135deg,#FF85A1,#FF4D8C)':'#FFD6E7',fontSize:13,fontWeight:800,color:'white',cursor:canSend&&!sending?'pointer':'not-allowed',boxShadow:canSend&&!sending?'0 4px 18px rgba(255,77,140,.35)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                {sending ? <Spinner/> : '💝 Kirim Penilaian'}
              </button>
            </>
          )}
        </div>

        {/* Reviews list */}
        <h3 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:14,fontWeight:700,color:'#B06080',marginBottom:12 }}>
          💬 Semua Ulasan {reviews.length>0&&`(${reviews.length})`}
        </h3>
        {fetching ? (
          <div style={{ textAlign:'center',padding:20 }}><Spinner/></div>
        ) : reviews.length===0 ? (
          <div style={{ textAlign:'center',padding:'18px 0',color:'#D090B0',fontSize:13,fontWeight:600 }}>
            <div style={{ fontSize:34,marginBottom:8 }}>💌</div>Belum ada yang kasih ulasan. Jadi yang pertama!
          </div>
        ) : (
          <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
            {reviews.map((r,i)=>(
              <div key={r._id||r.id} style={{ background:'#FFF8FB',border:'1.5px solid #FFE0EE',borderRadius:16,padding:'12px 14px',animation:`fadeIn .3s ease ${i*.04}s both` }}>
                <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:r.comment?6:0 }}>
                  <div style={{ display:'flex',alignItems:'center',gap:9 }}>
                    <div style={{ width:32,height:32,borderRadius:'50%',background:'linear-gradient(135deg,#FFB3CC,#FF79A8)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:13,fontWeight:800,color:'white',flexShrink:0 }}>{r.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <span style={{ fontWeight:800,fontSize:14,color:'#5C2A3A',display:'block',lineHeight:1.2 }}>{r.name}</span>
                      <span style={{ fontSize:10,color:'#D090B0',fontWeight:600 }}>{new Date(r.createdAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</span>
                    </div>
                  </div>
                  <Stars rating={r.rating} size={14} readOnly/>
                </div>
                {r.comment && <p style={{ fontSize:13,color:'#906070',lineHeight:1.5,fontStyle:'italic',marginTop:6 }}>"{r.comment}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Dish Card ──────────────────────────────────────────
function DishCard({ dish, onClick, onDelete, isAdmin }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const cat = CATEGORIES.find(c=>c.id===dish.category);

  const handleDelete = (e) => {
    e.stopPropagation();
    if (confirmDelete) {
      onDelete(dish._id||dish.id);
    } else {
      setConfirmDelete(true);
      // Reset konfirmasi setelah 3 detik kalau ga jadi
      setTimeout(() => setConfirmDelete(false), 3000);
    }
  };

  return (
    <div className="dish-card" style={{ background:'rgba(255,255,255,.96)',borderRadius:22,border:`2px solid ${isAdmin?'#FFCCE0':'#FFE0EE'}`,boxShadow:'0 4px 18px rgba(255,133,177,.1)',display:'flex',overflow:'hidden',minHeight:132,position:'relative' }}>

      {/* Tombol hapus — selalu keliatan kalau admin */}
      {isAdmin && (
        <button
          onClick={handleDelete}
          title={confirmDelete ? 'Klik sekali lagi untuk konfirmasi' : 'Hapus hidangan ini'}
          style={{
            position:'absolute', top:8, right:8, zIndex:2,
            padding: confirmDelete ? '5px 10px' : '5px 8px',
            borderRadius:20, border:'none', cursor:'pointer',
            fontSize:11, fontWeight:700,
            background: confirmDelete
              ? 'linear-gradient(135deg,#FF6B6B,#FF4040)'
              : 'rgba(255,214,231,.95)',
            color: confirmDelete ? 'white' : '#E05080',
            boxShadow: confirmDelete ? '0 2px 8px rgba(255,64,64,.4)' : 'none',
            transition:'all .2s',
            display:'flex', alignItems:'center', gap:4,
            whiteSpace:'nowrap',
          }}
        >
          {confirmDelete ? '⚠️ Yakin hapus?' : '🗑️'}
        </button>
      )}

      {/* Foto / emoji */}
      <div style={{ width:132,minHeight:132,flexShrink:0,cursor:'pointer' }} onClick={onClick}>
        {dish.image ? (
          <img src={dish.image} alt={dish.name} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',minHeight:132 }}/>
        ) : (
          <div style={{ width:'100%',height:'100%',minHeight:132,background:'linear-gradient(145deg,#FFF0F7,#FFE0EE)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:50 }}>{dish.emoji}</div>
        )}
      </div>

      {/* Info */}
      <div style={{ flex:1,padding:`15px ${isAdmin?'80px':'40px'} 15px 18px`,display:'flex',flexDirection:'column',justifyContent:'space-between',cursor:'pointer' }} onClick={onClick}>
        <div>
          <h3 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:16,fontWeight:700,color:'#5C2A3A',lineHeight:1.3,marginBottom:5 }}>{dish.name}</h3>
          {cat && <span style={{ background:'#FFF0F7',border:'1.5px solid #FFB3CC',borderRadius:20,padding:'3px 10px',fontSize:10,color:'#FF79A8',fontWeight:700,display:'inline-block',marginBottom:6 }}>{cat.emoji} {cat.label}</span>}
          {dish.description && <p style={{ fontSize:12,color:'#B07090',lineHeight:1.4,fontStyle:'italic' }}>{dish.description}</p>}
        </div>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:8,marginTop:8 }}>
          <div>
            <div style={{ display:'flex',alignItems:'center',gap:5,marginBottom:2 }}>
              <StarDisplay rating={dish.avgRating||0} size={14}/>
              {(dish.reviewCount||0)>0 && <span style={{ fontSize:12,fontWeight:800,color:'#FF4D8C' }}>{dish.avgRating}</span>}
            </div>
            <span style={{ fontSize:11,color:'#D090B0',fontWeight:600 }}>{(dish.reviewCount||0)===0?'Belum ada ulasan':`${dish.reviewCount} ulasan`}</span>
          </div>
          <div style={{ background:'linear-gradient(135deg,#FF85A1,#FF4D8C)',borderRadius:50,padding:'7px 15px',fontSize:12,fontWeight:800,color:'white',boxShadow:'0 3px 10px rgba(255,77,140,.3)',flexShrink:0 }}>⭐ Nilai</div>
        </div>
      </div>
    </div>
  );
}

// ── Admin Login Modal ──────────────────────────────────
function AdminLoginModal({ onClose, onLogin }) {
  const [pass,  setPass]  = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!pass) return;
    setLoading(true); setError('');
    try {
      await api.adminLogin(pass);
      onLogin();
      onClose();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div onClick={e=>e.target===e.currentTarget&&onClose()} style={{ position:'fixed',inset:0,zIndex:999,background:'rgba(255,180,210,.42)',backdropFilter:'blur(8px)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ background:'white',borderRadius:24,padding:'28px 24px',width:'100%',maxWidth:360,border:'2px solid #FFE0EE',boxShadow:'0 20px 60px rgba(255,77,140,.18)',animation:'popIn .3s ease' }}>
        <div style={{ textAlign:'center',marginBottom:20 }}>
          <div style={{ fontSize:44,marginBottom:8 }}>🔐</div>
          <h2 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:18,fontWeight:800,color:'#FF4D8C' }}>Admin Login</h2>
          <p style={{ fontSize:12,color:'#C880A0',marginTop:4 }}>Masukkan password admin kamu</p>
        </div>
        <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
          onKeyDown={e=>e.key==='Enter'&&handleLogin()}
          placeholder="Password..." style={{ width:'100%',padding:'12px 14px',borderRadius:14,border:'2px solid #FFB3CC',fontSize:14,color:'#5C2A3A',outline:'none',background:'#FFF8FB',marginBottom:12 }}/>
        {error && <p style={{ fontSize:12,color:'#E05060',marginBottom:10,textAlign:'center' }}>⚠️ {error}</p>}
        <button className={pass&&!loading?'btn-pink':''} onClick={handleLogin} disabled={!pass||loading} style={{ width:'100%',padding:12,borderRadius:50,border:'none',background:pass&&!loading?'linear-gradient(135deg,#FF85A1,#FF4D8C)':'#FFD6E7',fontSize:13,fontWeight:800,color:'white',cursor:pass&&!loading?'pointer':'not-allowed',boxShadow:pass&&!loading?'0 4px 18px rgba(255,77,140,.35)':'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
          {loading ? <Spinner/> : '🔓 Login'}
        </button>
      </div>
    </div>
  );
}

// ── App ────────────────────────────────────────────────
export default function App() {
  const [dishes,    setDishes]    = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [active,    setActive]    = useState(null);
  const [isAdmin,   setIsAdmin]   = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  const loadFoods = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await api.getFoods();
      setDishes(res.data);
    } catch (e) {
      setError('Gagal memuat data. Pastikan backend berjalan.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadFoods();

    // Cek token tersimpan → auto login kalau masih valid
    const token = localStorage.getItem('admin_token');
    if (token) {
      api.setToken(token);
      api.verifyAdmin()
        .then(() => setIsAdmin(true))
        .catch(() => { localStorage.removeItem('admin_token'); api.clearToken(); });
    }

    // Deteksi URL ?admin → buka modal login
    // Cara akses: http://localhost:5173/?admin
    const params = new URLSearchParams(window.location.search);
    if (params.has('admin')) {
      setShowLogin(true);
      // Bersihin URL supaya ga keliatan di address bar setelah dibuka
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [loadFoods]);

  const handleAdminLogin = () => {
    setIsAdmin(true);
    localStorage.setItem('admin_token', api.getToken());
  };
  const handleLogout = () => {
    api.clearToken();
    localStorage.removeItem('admin_token');
    setIsAdmin(false);
  };

  const handleAddDish  = (dish) => { setDishes(p=>[...p,dish]); setShowAdd(false); };
  const handleDeleteDish = async (id) => {
    try {
      await api.deleteFood(id);
      setDishes(p => p.filter(d => (d._id||d.id) !== id));
    } catch (e) { alert(e.message); }
  };

  const totalReviews = dishes.reduce((a,d)=>a+(d.reviewCount||0), 0);
  const avgAll = dishes.length && totalReviews
    ? +(dishes.reduce((a,d)=>a+(d.avgRating||0)*(d.reviewCount||0),0)/totalReviews).toFixed(1)
    : null;

  return (
    <>
      <style>{css}</style>
      {/* BG */}
      <div style={{ position:'fixed',inset:0,zIndex:0,background:'linear-gradient(155deg,#fff0f7 0%,#ffe4f0 55%,#fff5fa 100%)',pointerEvents:'none' }}>
        <FloatingClouds/>
      </div>

      <div style={{ position:'relative',zIndex:1,minHeight:'100vh' }}>
        {/* Header */}
        <div style={{ background:'rgba(255,255,255,.88)',borderBottom:'2px solid #FFE0EE',boxShadow:'0 4px 22px rgba(255,133,177,.12)',position:'sticky',top:0,zIndex:50,backdropFilter:'blur(10px)' }}>
          <div style={{ maxWidth:620,margin:'0 auto',padding:'14px 20px',display:'flex',justifyContent:'space-between',alignItems:'center',flexWrap:'wrap',gap:12 }}>
            <div>
              <h1 style={{ fontFamily:"'Dancing Script',cursive",fontSize:28,fontWeight:700,background:'linear-gradient(135deg,#FF69A0,#FF4D8C,#FF85B3)',WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',lineHeight:1.15 }}>
                🍳 arumachwanz yum~
              </h1>
              <p style={{ fontSize:12,color:'#C880A0',fontWeight:600,marginTop:1,fontStyle:'italic' }}>✨ Trust me, it was made with love</p>
            </div>
            {/* Tombol hanya muncul kalau udah login — pengunjung biasa ga lihat apapun */}
            {isAdmin && (
              <div style={{ display:'flex',gap:8,alignItems:'center' }}>
                <button className="btn-pink" onClick={()=>setShowAdd(true)} style={{ padding:'10px 18px',background:'linear-gradient(135deg,#FF85A1,#FF4D8C)',border:'none',borderRadius:50,color:'white',fontWeight:800,fontSize:12,cursor:'pointer',boxShadow:'0 4px 18px rgba(255,77,140,.33)' }}>+ Tambah</button>
                <button onClick={handleLogout} title="Keluar dari mode admin" style={{ padding:'8px 12px',background:'transparent',border:'none',color:'#D0A0B8',fontWeight:600,fontSize:11,cursor:'pointer',opacity:.5 }}>✕ exit</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth:620,margin:'0 auto',padding:'22px 20px 72px' }}>
          {/* Stats */}
          {dishes.length>0 && avgAll && (
            <div style={{ background:'rgba(255,255,255,.88)',border:'2px solid #FFE0EE',borderRadius:22,padding:'14px 18px',marginBottom:22,display:'flex',gap:14,flexWrap:'wrap',alignItems:'center',boxShadow:'0 4px 16px rgba(255,133,177,.1)',animation:'popIn .4s ease',backdropFilter:'blur(6px)' }}>
              <div style={{ fontSize:30,animation:'floatBob 2.5s ease-in-out infinite',flexShrink:0 }}>💕</div>
              {[
                { label:'ULASAN',    value:totalReviews },
                { label:'RATA-RATA', value:<div style={{ display:'flex',alignItems:'center',gap:5 }}><span style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:22,fontWeight:800,color:'#FF4D8C',lineHeight:1 }}>{avgAll}</span><StarDisplay rating={parseFloat(avgAll)} size={13}/></div> },
                { label:'HIDANGAN',  value:dishes.length },
              ].map((s,i,arr)=>(
                <div key={s.label} style={{ display:'contents' }}>
                  <div style={{ textAlign:'center',flex:1 }}>
                    <p style={{ fontSize:9,fontWeight:700,color:'#D090B0',letterSpacing:'.6px',marginBottom:2 }}>{s.label}</p>
                    {typeof s.value==='number'
                      ? <p style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:22,fontWeight:800,color:'#FF4D8C',lineHeight:1 }}>{s.value}</p>
                      : s.value}
                  </div>
                  {i<arr.length-1 && <div style={{ width:1,height:34,background:'#FFE0EE' }}/>}
                </div>
              ))}
            </div>
          )}

          {/* States */}
          {loading ? (
            <div style={{ textAlign:'center',padding:'80px 20px' }}>
              <Spinner/><p style={{ color:'#D090B0',marginTop:14,fontWeight:600 }}>Memuat hidangan...</p>
            </div>
          ) : error ? (
            <div style={{ textAlign:'center',padding:'60px 20px' }}>
              <div style={{ fontSize:50,marginBottom:12 }}>😢</div>
              <p style={{ color:'#E07070',fontWeight:700,marginBottom:16 }}>{error}</p>
              <button className="btn-pink" onClick={loadFoods} style={{ padding:'10px 24px',background:'linear-gradient(135deg,#FF85A1,#FF4D8C)',border:'none',borderRadius:50,color:'white',fontWeight:800,fontSize:13,cursor:'pointer' }}>Coba Lagi</button>
            </div>
          ) : dishes.length===0 ? (
            <div style={{ textAlign:'center',padding:'72px 20px',animation:'popIn .5s ease' }}>
              <div style={{ fontSize:76,animation:'floatBob 3s ease-in-out infinite',marginBottom:14,lineHeight:1 }}>👩‍🍳</div>
              <h2 style={{ fontFamily:"'Baloo 2',sans-serif",fontSize:22,color:'#FF79A8',marginBottom:8 }}>Belum ada hidangan nih~</h2>
              <p style={{ color:'#D090B0',fontSize:14,fontWeight:600,marginBottom:26,lineHeight:1.7 }}>
                {isAdmin ? 'Tambahkan masakan pertama kamu!' : 'Belum ada hidangan yang ditambahkan.'}
              </p>
              {isAdmin && (
                <button className="btn-pink" onClick={()=>setShowAdd(true)} style={{ padding:'14px 32px',background:'linear-gradient(135deg,#FF85A1,#FF4D8C)',border:'none',borderRadius:50,color:'white',fontWeight:800,fontSize:14,cursor:'pointer',boxShadow:'0 6px 22px rgba(255,77,140,.38)' }}>
                  ✨ Tambah Hidangan Pertama
                </button>
              )}
            </div>
          ) : (
            <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
              {dishes.map((dish,i)=>(
                <div key={dish._id||dish.id} style={{ animation:`popIn .35s ease ${i*.06}s both` }}>
                  <DishCard dish={dish} onClick={()=>setActive(dish)} onDelete={handleDeleteDish} isAdmin={isAdmin}/>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd   && <AddDishModal onClose={()=>setShowAdd(false)} onSave={handleAddDish}/>}
      {active    && <ReviewModal dish={active} onClose={()=>setActive(null)} onReviewAdded={loadFoods}/>}
      {showLogin && <AdminLoginModal onClose={()=>setShowLogin(false)} onLogin={handleAdminLogin}/>}
    </>
  );
}