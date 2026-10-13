import { useEffect, useMemo, useState } from 'react';
import { api } from './api.js';

const formatMoney = (value) => new Intl.NumberFormat('en-IN', {
  style: 'currency', currency: 'INR', maximumFractionDigits: 2,
}).format(Number(value) || 0);
const formatDate = (value) => value ? new Intl.DateTimeFormat('en-IN', {
  day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata',
}).format(new Date(value)) : '—';
const restaurantDateFormatter = new Intl.DateTimeFormat('en-GB', {
  year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Kolkata',
});
const restaurantDateKey = (value) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const parts = Object.fromEntries(restaurantDateFormatter.formatToParts(date).map(({ type, value: part }) => [type, part]));
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const calendarDateKey = (date) => `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
const shiftMonthStart = (monthStart, offset) => {
  const [year, month] = monthStart.split('-').map(Number);
  return calendarDateKey(new Date(Date.UTC(year, month - 1 + offset, 1)));
};
const previousCalendarDay = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return calendarDateKey(new Date(Date.UTC(year, month - 1, day - 1)));
};
const formatCalendarDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, day)));
};
const roundMoney = (value) => Math.round((value + Number.EPSILON) * 100) / 100;
const percent = (value) => Math.min(100, Math.max(0, Number(value) || 0));
const categoryRank = (name) => name === 'Veg Rolls' ? 0 : name === 'Non-Veg Rolls' ? 1 : 2;
const menuTypes = ['Paneer', 'Egg', 'Chicken', 'Cheese', 'Tikka', 'Kathi', 'Reshmi', 'Seek', 'Mushroom'];
const featuredRollNames = ['Egg Roll', 'Paneer Roll', 'Chicken Roll'];
const sortCategories = (a, b) => categoryRank(a) - categoryRank(b) || a.localeCompare(b);
const matchesMenuSearch = (item, query) => {
  const words = query.trim().toLowerCase().replace(/[-/]/g, ' ').split(/\s+/).filter(Boolean);
  const itemText = `${item.name} ${item.category}`.toLowerCase().replace(/[-/]/g, ' ');
  return words.every((word) => itemText.includes(word));
};
const groupMenu = (items) => {
  const groups = new Map();
  items.forEach((item) => {
    const name = item.category || 'Other';
    if (!groups.has(name)) groups.set(name, []);
    groups.get(name).push(item);
  });
  return [...groups].sort(([a], [b]) => sortCategories(a, b)).map(([name, groupItems]) => ({
    name, items: groupItems.sort((a, b) => a.name.localeCompare(b.name)),
  }));
};

const initialSettings = { restaurantName: 'Roll Express' };
function readSettings() {
  try {
    const stored = JSON.parse(localStorage.getItem('roll-express-settings'));
    return { restaurantName: stored?.restaurantName || initialSettings.restaurantName };
  } catch {
    return initialSettings;
  }
}

function Icon({ name, size = 20, strokeWidth = 1.8, ...props }) {
  const shapes = {
    receipt: <><path d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3Z"/><path d="M8 8h8M8 12h8M8 16h5"/></>,
    menu: <><path d="M4 7h16M4 12h16M4 17h16"/></>,
    settings: <><path d="M4 7h16M4 17h16M8 5v4M16 15v4"/><circle cx="8" cy="7" r="2"/><circle cx="16" cy="17" r="2"/></>,
    plus: <path d="M12 5v14M5 12h14"/>,
    minus: <path d="M5 12h14"/>,
    search: <><circle cx="11" cy="11" r="7"/><path d="m16 16 5 5"/></>,
    close: <path d="M5 5 19 19M19 5 5 19"/>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14M10 11v6M14 11v6"/></>,
    printer: <><path d="M6 9V3h12v6M6 17H4V9h16v8h-2M6 14h12v7H6v-7Z"/><path d="M17 12h.01"/></>,
    check: <path d="m4 12 5 5L20 6"/>,
    arrow: <path d="M4 12h16m-6-6 6 6-6 6"/>,
    bag: <><path d="M4 9h16l-1 12H5L4 9ZM8 9V7a4 4 0 0 1 8 0v2"/></>,
    table: <><path d="M3 7h18v5H3zM6 12v9M18 12v9"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    card: <><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20M6 15h4"/></>,
    wallet: <><path d="M4 6h15a2 2 0 0 1 2 2v11H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2ZM4 6V4h14"/><path d="M16 13h5"/></>,
    edit: <><path d="m4 17 11-11 3 3L7 20H4v-3ZM14 7l2-2a2 2 0 0 1 3 3l-2 2"/></>,
    refresh: <><path d="M20 11a8 8 0 0 0-14-5L4 8M4 4v4h4M4 13a8 8 0 0 0 14 5l2-2M20 20v-4h-4"/></>,
    chevron: <path d="m6 9 6 6 6-6"/>,
    spark: <><path d="m12 2 1.5 6.5L20 10l-6.5 1.5L12 18l-1.5-6.5L4 10l6.5-1.5L12 2ZM19 17l.5 1.5L21 19l-1.5.5L19 21l-.5-1.5L17 19l1.5-.5L19 17Z"/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>{shapes[name]}</svg>;
}

function App() {
  const [page, setPage] = useState('new');
  const [settings, setSettings] = useState(readSettings);
  const [menu, setMenu] = useState([]);
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [cart, setCart] = useState({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All items');
  const [menuType, setMenuType] = useState('All types');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [saving, setSaving] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [editingItem, setEditingItem] = useState(null);

  async function loadData() {
    setLoading(true);
    const [menuResult, billsResult] = await Promise.allSettled([api.menu(), api.bills()]);
    if (menuResult.status === 'fulfilled') setMenu(menuResult.value || []);
    if (billsResult.status === 'fulfilled') setBills(billsResult.value || []);
    if (menuResult.status === 'rejected' || billsResult.status === 'rejected') {
      setNotice({ type: 'error', message: 'Cannot reach the billing server. Start Spring Boot and try Refresh.' });
    }
    setLoading(false);
  }

  useEffect(() => { loadData(); }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 6500);
    return () => clearTimeout(timer);
  }, [notice]);

  const categories = useMemo(() => ['All items', ...[...new Set(menu.map((item) => item.category).filter(Boolean))].sort(sortCategories)], [menu]);
  const types = useMemo(() => ['All types', ...menuTypes.filter((type) => menu.some((item) => item.name.toLowerCase().includes(type.toLowerCase())))], [menu]);
  useEffect(() => {
    if (!categories.includes(category)) setCategory('All items');
    if (!types.includes(menuType)) setMenuType('All types');
  }, [categories, types, category, menuType]);
  const visibleMenu = useMemo(() => menu.filter((item) => {
    const categoryMatch = category === 'All items' || item.category === category;
    const typeMatch = menuType === 'All types' || item.name.toLowerCase().includes(menuType.toLowerCase());
    return categoryMatch && typeMatch && (!availableOnly || item.available) && matchesMenuSearch(item, search);
  }), [menu, category, menuType, availableOnly, search]);
  const featuredMenu = featuredRollNames.map((name) => visibleMenu.find((item) => item.name.trim().toLowerCase() === name.toLowerCase())).filter(Boolean);
  const featuredIds = new Set(featuredMenu.map((item) => item.id));
  const groupedOtherMenu = groupMenu(visibleMenu.filter((item) => !featuredIds.has(item.id)));
  const otherMenuCount = visibleMenu.length - featuredMenu.length;
  const menuFiltersActive = Boolean(search.trim()) || category !== 'All items' || menuType !== 'All types' || availableOnly;
  const cartItems = useMemo(() => Object.entries(cart).map(([id, quantity]) => {
    const item = menu.find((candidate) => String(candidate.id) === id);
    return item ? { ...item, quantity } : null;
  }).filter(Boolean), [cart, menu]);
  const totals = useMemo(() => {
    const subtotal = roundMoney(cartItems.reduce((sum, item) => sum + Number(item.price) * item.quantity, 0));
    const discount = roundMoney(subtotal * percent(discountPercent) / 100);
    return { subtotal, discount, total: roundMoney(subtotal - discount) };
  }, [cartItems, discountPercent]);
  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  function updateQuantity(id, change) {
    setCart((previous) => {
      const next = { ...previous };
      const quantity = (next[id] || 0) + change;
      if (quantity <= 0) delete next[id];
      else next[id] = quantity;
      return next;
    });
  }

  function clearBill() {
    setCart({});
    setCustomerName('');
    setDiscountPercent(0);
    setPaymentMethod('CASH');
  }

  function clearMenuFilters() {
    setSearch('');
    setCategory('All items');
    setMenuType('All types');
    setAvailableOnly(false);
  }

  async function refreshBills() {
    const result = await api.bills();
    setBills(result || []);
  }

  async function createBill(payNow) {
    if (!cartItems.length) {
      setNotice({ type: 'error', message: 'Add at least one item to create a bill.' });
      return;
    }
    setSaving(true);
    try {
      let savedBill = await api.createBill({
        customerName: customerName.trim() || null,
        items: cartItems.map((item) => ({ menuItemId: item.id, quantity: item.quantity })),
        discountPercent: percent(discountPercent),
      });
      let paymentError = null;
      if (payNow) {
        try { savedBill = await api.payBill(savedBill.id, paymentMethod); }
        catch (error) { paymentError = error; }
      }
      setReceipt(savedBill);
      clearBill();
      try { await refreshBills(); } catch { /* The saved receipt remains available. */ }
      setNotice(paymentError
        ? { type: 'error', message: `Bill ${savedBill.billNumber} was saved, but payment could not be recorded: ${paymentError.message}` }
        : { type: 'success', message: payNow ? 'Bill saved and payment recorded.' : 'Bill saved. You can collect payment later.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function markPaid(bill, method) {
    setSaving(true);
    try {
      const paidBill = await api.payBill(bill.id, method);
      setReceipt(paidBill);
      try { await refreshBills(); } catch { /* The updated receipt remains available. */ }
      setNotice({ type: 'success', message: 'Payment recorded.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    } finally {
      setSaving(false);
    }
  }

  async function saveMenuItem(item) {
    if (!item.name.trim() || !item.category.trim() || Number(item.price) <= 0) {
      setNotice({ type: 'error', message: 'Enter a name, category, and price above zero.' });
      return false;
    }
    try {
      if (item.id) await api.updateMenuItem(item.id, item);
      else await api.addMenuItem(item);
      setMenu(await api.menu());
      setNotice({ type: 'success', message: item.id ? 'Menu item updated.' : 'Menu item added.' });
      return true;
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
      return false;
    }
  }

  async function deleteMenuItem(item) {
    if (!window.confirm(`Delete ${item.name} from the menu? Past bills will keep their saved item details.`)) return;
    try {
      await api.deleteMenuItem(item.id);
      setMenu(await api.menu());
      setCart((previous) => {
        const next = { ...previous };
        delete next[item.id];
        return next;
      });
      setNotice({ type: 'success', message: 'Menu item deleted.' });
    } catch (error) {
      setNotice({ type: 'error', message: error.message });
    }
  }

  function saveSettings(next) {
    const clean = {
      restaurantName: next.restaurantName.trim() || 'Roll Express',
    };
    localStorage.setItem('roll-express-settings', JSON.stringify(clean));
    setSettings(clean);
    setNotice({ type: 'success', message: 'Reception settings saved in this browser.' });
  }

  const title = page === 'new' ? 'Create a takeaway bill' : page === 'bills' ? 'Bills & payments' : page === 'menu' ? 'Your menu' : 'Settings';
  const subtitle = page === 'new' ? 'Choose rolls, review the total, and finish checkout.' : page === 'bills' ? 'Find past bills, record payment, and reprint receipts.' : page === 'menu' ? 'Keep items, prices, and availability up to date.' : 'Your receipt details.';

  return <div className="app-shell">
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark"><span>R</span></div>
        <div><strong>{settings.restaurantName}</strong><span>RECEPTION</span></div>
      </div>
      <div className="sidebar-label">WORKSPACE</div>
      <nav className="nav-list" aria-label="Main navigation">
        {[
          ['new', 'New bill', 'receipt'],
          ['bills', 'Bills & payments', 'clock'],
          ['menu', 'Menu items', 'menu'],
          ['settings', 'Settings', 'settings'],
        ].map(([key, label, icon]) => <button key={key} aria-label={label} className={`nav-item ${page === key ? 'active' : ''}`} onClick={() => setPage(key)}>
          <Icon name={icon} size={20} /><span>{label}</span>{key === 'new' && cartCount > 0 && <em>{cartCount}</em>}
        </button>)}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip"><Icon name="spark" size={19} /><span>Good food, smooth service.</span></div>
        <div className="staff-card"><span className="staff-avatar">RX</span><div><strong>Reception desk</strong><small>Ready to serve</small></div><span className="online-dot" /></div>
      </div>
    </aside>

    <div className="main-area">
      <header className="topbar">
        <div className="mobile-brand"><span className="mobile-mark">R</span><strong>{settings.restaurantName}</strong></div>
        <span className="today"><Icon name="clock" size={17}/>{new Intl.DateTimeFormat('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())}</span>
        <button className="refresh-button" onClick={loadData} title="Refresh data" aria-label="Refresh data"><Icon name="refresh" size={18}/></button>
      </header>

      <main className="main-content">
        <div className="page-heading"><div><p className="eyebrow">ROLL EXPRESS / {page.toUpperCase()}</p><h1>{title}</h1><p>{subtitle}</p></div>{page === 'new' && <div className="heading-badge"><Icon name="bag" size={15}/> Takeaway only</div>}{page === 'menu' && <button className="button primary add-item-button" onClick={() => setEditingItem({ name: '', category: '', price: '', available: true })}><Icon name="plus" size={18}/> Add item</button>}</div>

        {page === 'new' && <div className="billing-grid">
          <div className="billing-left">
            <section className="service-card">
              <div className="card-heading"><div><span className="step-number">01</span><h2>Customer details</h2></div><span className="optional-label">Takeaway order</span></div>
              <div className="takeaway-row"><span className="takeaway-icon"><Icon name="bag" size={22}/></span><div><strong>Ready for takeaway</strong><small>Add a name if you want it printed on the bill.</small></div></div>
              <div className="order-fields"><label className="field"><span>Customer name <small>(optional)</small></span><input value={customerName} onChange={(event) => setCustomerName(event.target.value)} placeholder="For the receipt" maxLength={80}/></label></div>
            </section>

            <section className="menu-section">
              <div className="card-heading menu-heading"><div><span className="step-number">02</span><h2>Add menu items</h2></div><span className="item-count">{menu.length} items</span></div>
              <div className="menu-toolbar"><div className="search-box"><Icon name="search" size={20}/><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search rolls by name..." aria-label="Search menu"/></div></div>
              <div className="menu-filter-row"><span className="filter-label">Category</span><div className="category-list" role="group" aria-label="Menu categories">{categories.map((name) => <button key={name} type="button" aria-pressed={category === name} className={`category-chip ${category === name ? 'active' : ''}`} onClick={() => setCategory(name)}>{name}<small>{name === 'All items' ? menu.length : menu.filter((item) => item.category === name).length}</small></button>)}</div></div>
              {types.length > 1 && <div className="menu-filter-row"><span className="filter-label">Find by</span><div className="type-list" role="group" aria-label="Roll ingredients and styles">{types.map((name) => <button key={name} type="button" aria-pressed={menuType === name} className={`type-chip ${menuType === name ? 'active' : ''}`} onClick={() => setMenuType(name)}>{name}</button>)}</div></div>}
              <div className="filter-summary"><label className="availability-toggle"><input type="checkbox" checked={availableOnly} onChange={(event) => setAvailableOnly(event.target.checked)}/> Available only</label><span aria-live="polite">Showing {visibleMenu.length} of {menu.length} items</span>{menuFiltersActive && <button type="button" className="clear-filters" onClick={clearMenuFilters}>Clear filters</button>}</div>
              <div className="menu-groups">
                {featuredMenu.length > 0 && <section className="featured-menu" aria-label="Most ordered rolls">
                  <div className="featured-menu-heading"><h3>Most ordered</h3><span>Quick add</span></div>
                  <div className="menu-grid">{featuredMenu.map((item) => <article className={`menu-card ${!item.available ? 'unavailable' : ''}`} key={item.id}>
                    <div className="menu-card-body"><span className="menu-category">{item.category}</span><h3>{item.name}</h3><div className="menu-card-footer"><strong>{formatMoney(item.price)}</strong><button disabled={!item.available} onClick={() => updateQuantity(item.id, 1)} aria-label={`Add ${item.name}`}><Icon name="plus" size={19} strokeWidth={2.4}/></button></div></div>
                    {!item.available && <span className="sold-out">Unavailable</span>}
                  </article>)}</div>
                </section>}
                {groupedOtherMenu.length > 0 && <section className="other-menu" aria-label="Other menu items">
                  <div className="other-menu-heading"><h3>Other menu items</h3><span>{otherMenuCount} {otherMenuCount === 1 ? 'item' : 'items'}</span></div>
                  {groupedOtherMenu.map((group) => <div className="menu-group" key={group.name}>
                    <div className="menu-group-heading"><h4>{group.name}</h4><span>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</span></div>
                    <div className="menu-list">{group.items.map((item) => <article className={`menu-list-item ${!item.available ? 'unavailable' : ''}`} key={item.id}>
                      <div className="menu-list-info"><strong>{item.name}</strong>{!item.available && <small>Unavailable</small>}</div>
                      <div className="menu-list-actions"><strong>{formatMoney(item.price)}</strong><button type="button" disabled={!item.available} onClick={() => updateQuantity(item.id, 1)} aria-label={`Add ${item.name}`}><Icon name="plus" size={18} strokeWidth={2.4}/></button></div>
                    </article>)}</div>
                  </div>)}
                </section>}
                {!loading && visibleMenu.length === 0 && <div className="empty-menu"><Icon name="search" size={28}/><strong>{menu.length ? 'No matching items' : 'Your menu is empty'}</strong><span>{menu.length ? 'Try a different search or clear your filters.' : 'Add your first item in Menu items.'}</span>{menu.length ? <button className="text-link" onClick={clearMenuFilters}>Clear filters <Icon name="arrow" size={16}/></button> : <button className="text-link" onClick={() => setPage('menu')}>Manage menu <Icon name="arrow" size={16}/></button>}</div>}
              </div>
            </section>
          </div>

          <aside className="order-panel" id="order-panel"><div className="order-panel-top"><div><span className="order-icon"><Icon name="receipt" size={21}/></span><div><h2>Current order</h2><p>{cartCount} {cartCount === 1 ? 'item' : 'items'} selected</p></div></div>{cartCount > 0 && <button className="clear-link" onClick={clearBill}>Clear</button>}</div>
            <div className="order-items">{cartItems.length ? cartItems.map((item) => <div className="cart-item" key={item.id}><div className="cart-item-top"><div><h3>{item.name}</h3><span>{formatMoney(item.price)} each</span></div><strong>{formatMoney(Number(item.price) * item.quantity)}</strong></div><div className="quantity-control"><button onClick={() => updateQuantity(item.id, -1)} aria-label={`Remove one ${item.name}`}><Icon name="minus" size={15}/></button><span>{item.quantity}</span><button onClick={() => updateQuantity(item.id, 1)} aria-label={`Add one ${item.name}`}><Icon name="plus" size={15}/></button></div></div>) : <div className="empty-cart"><div className="empty-cart-art"><Icon name="bag" size={31}/></div><strong>Your order is empty</strong><span>Choose something delicious from the menu to get started.</span></div>}</div>
            <div className="order-checkout"><div className="total-row"><span>Subtotal</span><strong>{formatMoney(totals.subtotal)}</strong></div><div className="adjustment-row"><label htmlFor="discount">Discount</label><div className="percent-input"><input id="discount" type="number" min="0" max="100" step="0.01" value={discountPercent} onChange={(event) => setDiscountPercent(event.target.value)} /><span>%</span></div><strong>− {formatMoney(totals.discount)}</strong></div><div className="grand-total"><span>Total to pay</span><strong>{formatMoney(totals.total)}</strong></div>
              <div className="payment-label">PAYMENT METHOD</div><div className="payment-options" role="group" aria-label="Payment method">{[['CASH', 'Cash', 'wallet'], ['CARD', 'Card', 'card'], ['UPI', 'UPI', 'spark']].map(([key, label, icon]) => <button key={key} className={paymentMethod === key ? 'active' : ''} onClick={() => setPaymentMethod(key)}><Icon name={icon} size={18}/>{label}</button>)}</div>
              <button className="button primary checkout-button" disabled={saving || cartCount === 0} onClick={() => createBill(true)}>{saving ? 'Saving bill...' : 'Save & record payment'}<Icon name="arrow" size={18}/></button><button className="save-later" disabled={saving || cartCount === 0} onClick={() => createBill(false)}>Save bill, collect payment later</button>
            </div>
          </aside>
        </div>}

        {page === 'bills' && <BillsPage bills={bills} loading={loading} onOpen={setReceipt} onNew={() => setPage('new')} />}
        {page === 'menu' && <MenuPage menu={menu} loading={loading} onEdit={setEditingItem} onDelete={deleteMenuItem} onAdd={() => setEditingItem({ name: '', category: '', price: '', available: true })} />}
        {page === 'settings' && <SettingsPage settings={settings} onSave={saveSettings} />}
      </main>
    </div>

    {page === 'new' && cartCount > 0 && !receipt && <button className="mobile-order-shortcut" onClick={() => document.getElementById('order-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' })}><span>{cartCount} {cartCount === 1 ? 'item' : 'items'} · {formatMoney(totals.total)}</span><strong>View order <Icon name="arrow" size={16}/></strong></button>}
    {notice && <div className={`toast ${notice.type}`} role="status"><span className="toast-symbol"><Icon name={notice.type === 'success' ? 'check' : 'close'} size={16}/></span><span>{notice.message}</span><button onClick={() => setNotice(null)} aria-label="Dismiss notification"><Icon name="close" size={17}/></button></div>}
    {receipt && <ReceiptModal bill={receipt} restaurantName={settings.restaurantName} saving={saving} onClose={() => setReceipt(null)} onPay={markPaid} />}
    {editingItem && <MenuItemModal item={editingItem} categories={categories.slice(1)} onClose={() => setEditingItem(null)} onSave={saveMenuItem} />}
  </div>;
}

function BillsPage({ bills, loading, onOpen, onNew }) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [dateRange, setDateRange] = useState('THIS_MONTH');
  const [todayKey, setTodayKey] = useState(() => restaurantDateKey(new Date()));
  const [customStart, setCustomStart] = useState(() => `${restaurantDateKey(new Date()).slice(0, 7)}-01`);
  const [customEnd, setCustomEnd] = useState(() => restaurantDateKey(new Date()));
  useEffect(() => {
    const timer = window.setInterval(() => setTodayKey(restaurantDateKey(new Date())), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const thisMonthStart = `${todayKey.slice(0, 7)}-01`;
  const lastMonthStart = shiftMonthStart(thisMonthStart, -1);
  const threeMonthStart = shiftMonthStart(thisMonthStart, -2);
  const customError = dateRange !== 'CUSTOM' ? ''
    : !customStart || !customEnd ? 'Choose both start and end dates.'
      : customStart > customEnd ? 'Start date must be on or before end date.' : '';
  const rangeStart = dateRange === 'LAST_MONTH' ? lastMonthStart
    : dateRange === 'LAST_3_MONTHS' ? threeMonthStart
      : dateRange === 'CUSTOM' ? customStart : thisMonthStart;
  const rangeEnd = dateRange === 'LAST_MONTH' ? previousCalendarDay(thisMonthStart)
    : dateRange === 'CUSTOM' ? customEnd : todayKey;
  const periodBills = customError ? [] : bills.filter((bill) => {
    const billDay = restaurantDateKey(bill.createdAt);
    return billDay && billDay >= rangeStart && billDay <= rangeEnd;
  });
  const filtered = periodBills.filter((bill) => {
    const statusMatch = filter === 'ALL' || (filter === 'PAID' ? bill.status === 'PAID' : bill.status !== 'PAID');
    const queryMatch = `${bill.billNumber} ${bill.customerName || ''}`.toLowerCase().includes(query.toLowerCase());
    return statusMatch && queryMatch;
  });
  const paidCount = periodBills.filter((bill) => bill.status === 'PAID').length;
  const dueCount = periodBills.length - paidCount;
  const rangeDescription = customError ? 'Choose a valid date range'
    : `${formatCalendarDate(rangeStart)} – ${formatCalendarDate(rangeEnd)}`;
  const emptyTitle = customError ? 'Check custom dates' : !bills.length ? 'No bills yet'
    : !periodBills.length ? 'No bills in this date range' : 'No bills found';
  const emptyMessage = customError || (!bills.length ? 'Create your first bill to see it here.'
    : !periodBills.length ? 'Choose another date range to see older bills.'
      : 'Try a different search or payment status.');
  return <div className="data-page"><div className="summary-strip"><div><span className="summary-icon green"><Icon name="receipt" size={22}/></span><div><small>Bills in range</small><strong>{customError ? '—' : periodBills.length}</strong></div></div><div><span className="summary-icon amber"><Icon name="clock" size={22}/></span><div><small>Awaiting payment</small><strong>{customError ? '—' : dueCount}</strong></div></div><div><span className="summary-icon mint"><Icon name="check" size={22}/></span><div><small>Paid bills</small><strong>{customError ? '—' : paidCount}</strong></div></div></div>
    <div className="data-card">
      <div className="bill-date-filters">
        <div className="bill-date-presets" role="group" aria-label="Bill date range">
          {[
            ['THIS_MONTH', 'This month'],
            ['LAST_MONTH', 'Last month'],
            ['LAST_3_MONTHS', 'Last 3 months'],
            ['CUSTOM', 'Custom dates'],
          ].map(([key, label]) => <button key={key} type="button" className={`bill-date-chip ${dateRange === key ? 'active' : ''}`} aria-pressed={dateRange === key} onClick={() => setDateRange(key)}>{label}</button>)}
        </div>
        {dateRange === 'CUSTOM' && <div className="bill-custom-range">
          <label className="bill-date-field"><span>From</span><input type="date" aria-label="From date" value={customStart} onChange={(event) => setCustomStart(event.target.value)}/></label>
          <label className="bill-date-field"><span>To</span><input type="date" aria-label="To date" value={customEnd} onChange={(event) => setCustomEnd(event.target.value)}/></label>
        </div>}
        <div className="bill-date-summary" aria-live="polite">{rangeDescription}{!customError && ` · ${periodBills.length} ${periodBills.length === 1 ? 'bill' : 'bills'}`}{dateRange === 'LAST_3_MONTHS' && <span>Includes this month and the previous two.</span>}</div>
        {customError && <div className="bill-date-error" role="alert">{customError}</div>}
      </div>
      <div className="data-toolbar"><div className="search-box"><Icon name="search" size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search bill or customer name" aria-label="Search bills"/></div><div className="segmented">{[['ALL', 'All'], ['DUE', 'Unpaid'], ['PAID', 'Paid']].map(([key, label]) => <button key={key} className={filter === key ? 'active' : ''} onClick={() => setFilter(key)}>{label}</button>)}</div></div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Bill</th><th>Date & time</th><th>Amount</th><th>Status</th><th></th></tr></thead><tbody>{filtered.map((bill) => <tr key={bill.id}><td><strong>{bill.billNumber}</strong><small>{bill.customerName || 'Walk-in customer'}</small></td><td>{formatDate(bill.createdAt)}</td><td><strong>{formatMoney(bill.total)}</strong></td><td><span className={`status-pill ${bill.status === 'PAID' ? 'paid' : 'due'}`}>{bill.status === 'PAID' ? 'Paid' : 'Unpaid'}</span></td><td><button className="row-action" onClick={() => onOpen(bill)}>View <Icon name="arrow" size={16}/></button></td></tr>)}</tbody></table></div>
      {!loading && filtered.length === 0 && <div className="empty-data"><div className="empty-data-icon"><Icon name="receipt" size={31}/></div><h3>{emptyTitle}</h3><p>{emptyMessage}</p>{!bills.length && !customError && <button className="button primary" onClick={onNew}><Icon name="plus" size={18}/> New bill</button>}</div>}
    </div>
  </div>;
}

function MenuPage({ menu, loading, onEdit, onDelete, onAdd }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All items');
  const [availability, setAvailability] = useState('ALL');
  const categories = ['All items', ...[...new Set(menu.map((item) => item.category).filter(Boolean))].sort(sortCategories)];
  useEffect(() => {
    if (category !== 'All items' && !menu.some((item) => item.category === category)) setCategory('All items');
  }, [category, menu]);
  const filtered = menu.filter((item) =>
    (category === 'All items' || item.category === category)
    && (availability === 'ALL' || (availability === 'AVAILABLE' ? item.available : !item.available))
    && matchesMenuSearch(item, query));
  const grouped = groupMenu(filtered);
  const filtersActive = Boolean(query.trim()) || category !== 'All items' || availability !== 'ALL';
  function clearFilters() {
    setQuery('');
    setCategory('All items');
    setAvailability('ALL');
  }
  return <div className="data-page"><div className="summary-strip two"><div><span className="summary-icon green"><Icon name="menu" size={22}/></span><div><small>Total items</small><strong>{menu.length}</strong></div></div><div><span className="summary-icon mint"><Icon name="check" size={22}/></span><div><small>Available now</small><strong>{menu.filter((item) => item.available).length}</strong></div></div></div>
    <div className="data-card"><div className="data-toolbar"><div className="search-box"><Icon name="search" size={19}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search menu items" aria-label="Search menu items"/></div><span className="toolbar-hint">Edit an item to change its price or availability.</span></div>
      <div className="manage-filters"><div className="menu-filter-row"><span className="filter-label">Category</span><div className="category-list" role="group" aria-label="Filter managed items by category">{categories.map((name) => <button key={name} type="button" aria-pressed={category === name} className={`category-chip ${category === name ? 'active' : ''}`} onClick={() => setCategory(name)}>{name}<small>{name === 'All items' ? menu.length : menu.filter((item) => item.category === name).length}</small></button>)}</div></div>
        <div className="manage-filter-bottom"><div className="segmented" role="group" aria-label="Filter by availability">{[['ALL', 'All'], ['AVAILABLE', 'Available'], ['UNAVAILABLE', 'Unavailable']].map(([key, label]) => <button key={key} type="button" aria-pressed={availability === key} className={availability === key ? 'active' : ''} onClick={() => setAvailability(key)}>{label}</button>)}</div><div className="manage-result-count" aria-live="polite">Showing {filtered.length} of {menu.length} items</div>{filtersActive && <button type="button" className="clear-filters" onClick={clearFilters}>Clear filters</button>}</div>
      </div>
      <div className="table-scroll"><table className="data-table"><thead><tr><th>Item</th><th>Category</th><th>Price</th><th>Availability</th><th></th></tr></thead>{grouped.map((group) => <tbody key={group.name}><tr className="menu-table-group"><th scope="rowgroup" colSpan={5}><span>{group.name}</span><small>{group.items.length} {group.items.length === 1 ? 'item' : 'items'}</small></th></tr>{group.items.map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>{item.category}</td><td><strong>{formatMoney(item.price)}</strong></td><td><span className={`status-pill ${item.available ? 'paid' : 'due'}`}>{item.available ? 'Available' : 'Unavailable'}</span></td><td><div className="row-buttons"><button onClick={() => onEdit(item)} title={`Edit ${item.name}`} aria-label={`Edit ${item.name}`}><Icon name="edit" size={18}/></button><button onClick={() => onDelete(item)} title={`Delete ${item.name}`} aria-label={`Delete ${item.name}`}><Icon name="trash" size={18}/></button></div></td></tr>)}</tbody>)}</table></div>
      {!loading && filtered.length === 0 && <div className="empty-data"><div className="empty-data-icon"><Icon name="menu" size={31}/></div><h3>{menu.length ? 'No menu items found' : 'Build your menu'}</h3><p>{menu.length ? 'Try another search or clear your filters.' : 'Add items and prices to start billing.'}</p>{menu.length ? <button className="button secondary" onClick={clearFilters}>Clear filters</button> : <button className="button primary" onClick={onAdd}><Icon name="plus" size={18}/> Add item</button>}</div>}
    </div>
  </div>;
}

function SettingsPage({ settings, onSave }) {
  const [draft, setDraft] = useState(settings);
  useEffect(() => setDraft(settings), [settings]);
  return <div className="settings-card"><div className="settings-card-header"><span className="summary-icon green"><Icon name="settings" size={22}/></span><div><h2>Restaurant details</h2><p>These details appear on printed receipts in this browser.</p></div></div><form onSubmit={(event) => { event.preventDefault(); onSave(draft); }}><label className="field"><span>Restaurant name</span><input value={draft.restaurantName} onChange={(event) => setDraft({ ...draft, restaurantName: event.target.value })} maxLength={80}/></label><div className="settings-note">Currency is INR (₹). Bills are takeaway only and tax is not added.</div><button className="button primary" type="submit">Save settings <Icon name="arrow" size={18}/></button></form></div>;
}

function MenuItemModal({ item, categories, onClose, onSave }) {
  const [draft, setDraft] = useState({ ...item });
  const [busy, setBusy] = useState(false);
  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    const saved = await onSave({ ...draft, price: Number(draft.price), available: Boolean(draft.available) });
    setBusy(false);
    if (saved) onClose();
  }
  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal form-modal" role="dialog" aria-modal="true" aria-labelledby="item-title"><div className="modal-header"><div><p className="eyebrow">MENU MANAGEMENT</p><h2 id="item-title">{item.id ? 'Edit menu item' : 'Add menu item'}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div><form onSubmit={submit}><label className="field"><span>Item name</span><input required autoFocus value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} placeholder="e.g. Paneer Kathi Roll" maxLength={100}/></label><label className="field"><span>Category</span><input required list="menu-category-options" value={draft.category} onChange={(event) => setDraft({ ...draft, category: event.target.value })} placeholder="Choose or type a category" maxLength={60}/><datalist id="menu-category-options">{categories.map((name) => <option value={name} key={name}/>)}</datalist></label><label className="field"><span>Price (₹)</span><input required type="number" min="0.01" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: event.target.value })} placeholder="0.00"/></label><label className="toggle-row"><span><strong>Available for ordering</strong><small>Unavailable items stay visible but cannot be added.</small></span><input type="checkbox" checked={Boolean(draft.available)} onChange={(event) => setDraft({ ...draft, available: event.target.checked })}/><span className="toggle-track"/></label><div className="modal-actions"><button className="button secondary" type="button" onClick={onClose}>Cancel</button><button className="button primary" type="submit" disabled={busy}>{busy ? 'Saving...' : item.id ? 'Save changes' : 'Add item'}</button></div></form></div></div>;
}

function ReceiptModal({ bill, restaurantName, saving, onClose, onPay }) {
  const [method, setMethod] = useState('CASH');
  const paid = bill.status === 'PAID';
  const historicalTax = Number(bill.taxAmount) > 0;

  return <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="modal receipt-modal" role="dialog" aria-modal="true" aria-labelledby="receipt-title">
      <div className="modal-header no-print"><div><p className="eyebrow">BILL DETAILS</p><h2 id="receipt-title">{bill.billNumber}</h2></div><button className="icon-button" onClick={onClose} aria-label="Close"><Icon name="close"/></button></div>
      <div className="print-receipt">
        <div className="receipt-brand"><span className="receipt-mark">R</span><h2>{restaurantName}</h2><p>Fresh rolls for the road</p></div>
        <div className="receipt-divider"/>
        <div className="receipt-meta">
          <div><span>Bill number</span><strong>{bill.billNumber}</strong></div>
          <div><span>Date</span><strong>{formatDate(bill.createdAt)}</strong></div>
          {bill.serviceType === 'DINE_IN' && <div><span>Archived order</span><strong>Table {bill.tableNumber || '—'}</strong></div>}
          {bill.customerName && <div><span>Customer</span><strong>{bill.customerName}</strong></div>}
        </div>
        <div className="receipt-divider"/>
        <div className="receipt-lines">{(bill.items || []).map((item, index) => <div key={index}><span>{item.quantity} × {item.name}</span><strong>{formatMoney(item.lineTotal)}</strong></div>)}</div>
        <div className="receipt-divider"/>
        <div className="receipt-totals">
          <div><span>Subtotal</span><strong>{formatMoney(bill.subtotal)}</strong></div>
          <div><span>Discount{Number(bill.discountPercent) ? ` (${bill.discountPercent}%)` : ''}</span><strong>− {formatMoney(bill.discountAmount)}</strong></div>
          {historicalTax && <div><span>Tax ({bill.taxPercent}%)</span><strong>{formatMoney(bill.taxAmount)}</strong></div>}
          <div className="receipt-grand"><span>Total</span><strong>{formatMoney(bill.total)}</strong></div>
        </div>
        <div className="receipt-status">{paid ? `Paid${bill.paymentMethod ? ` · ${bill.paymentMethod}` : ''}` : 'Payment pending'}</div>
        <p className="receipt-footer">Thank you for choosing {restaurantName}.</p>
      </div>
      <div className="receipt-actions no-print">
        {!paid && <div className="receipt-pay"><span>Record payment</span><div className="payment-options">{['CASH', 'CARD', 'UPI'].map((key) => <button key={key} className={method === key ? 'active' : ''} onClick={() => setMethod(key)}>{key}</button>)}</div><button className="button primary" disabled={saving} onClick={() => onPay(bill, method)}>{saving ? 'Saving...' : 'Mark as paid'}</button></div>}
        <button className="button secondary print-button" onClick={() => window.print()}><Icon name="printer" size={18}/> Print receipt</button>
      </div>
    </div>
  </div>;
}

export default App;
