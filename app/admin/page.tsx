'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, Loader2, ChevronDown, ChevronUp, MessageSquare, Car } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Vehicle, EngineType, Conversation, Message } from '@/types';

// ─── Vehicle Form ─────────────────────────────────────────────────────────────

interface VehicleFormData {
  brand: string; model: string; type: string; seats: string; licensePlate: string;
  year: string; engineTypeId: string; engineCC: string; powerKW: string;
  transmissionType: string; mileage: string; availabilityStatus: string;
  locationId: string; notes: string;
  halfDayPrice: string; fullDayPrice: string; weekendPrice: string;
  weekPrice: string; monthPrice: string;
}

const emptyForm: VehicleFormData = {
  brand: '', model: '', type: 'sedan', seats: '5', licensePlate: '',
  year: String(new Date().getFullYear()),
  engineTypeId: '1', engineCC: '', powerKW: '', transmissionType: 'manual',
  mileage: '0', availabilityStatus: 'available', locationId: '1', notes: '',
  halfDayPrice: '', fullDayPrice: '', weekendPrice: '', weekPrice: '', monthPrice: '',
};

function vehicleToForm(v: Vehicle): VehicleFormData {
  return {
    brand: v.brand, model: v.model, type: v.type, seats: String(v.seats),
    licensePlate: v.licensePlate, year: String(v.year),
    engineTypeId: String(v.engineTypeId), engineCC: String(v.engineCC || ''),
    powerKW: String(v.powerKW || ''), transmissionType: v.transmissionType,
    mileage: String(v.mileage || 0), availabilityStatus: v.availabilityStatus,
    locationId: String(v.locationId), notes: v.notes || '',
    halfDayPrice: v.halfDayPrice ? String(v.halfDayPrice) : '',
    fullDayPrice: v.fullDayPrice ? String(v.fullDayPrice) : '',
    weekendPrice: v.weekendPrice ? String(v.weekendPrice) : '',
    weekPrice: v.weekPrice ? String(v.weekPrice) : '',
    monthPrice: v.monthPrice ? String(v.monthPrice) : '',
  };
}

// ─── Vehicles Tab ─────────────────────────────────────────────────────────────

function VehiclesTab() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [engineTypes, setEngineTypes] = useState<EngineType[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editVehicle, setEditVehicle] = useState<Vehicle | null>(null);
  const [form, setForm] = useState<VehicleFormData>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const [vRes, eRes] = await Promise.all([
      fetch('/api/vehicles'),
      fetch('/api/engine-types'),
    ]);
    if (vRes.ok) setVehicles(await vRes.json());
    if (eRes.ok) setEngineTypes(await eRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() {
    setEditVehicle(null);
    setForm(emptyForm);
    setDialogOpen(true);
  }

  function openEdit(v: Vehicle) {
    setEditVehicle(v);
    setForm(vehicleToForm(v));
    setDialogOpen(true);
  }

  async function handleSave() {
    setSaving(true);
    const body = {
      brand:               form.brand,
      model:               form.model,
      type:                form.type,
      seats:               Number(form.seats),
      licensePlate:        form.licensePlate,
      year:                Number(form.year),
      engineTypeId:        Number(form.engineTypeId),
      engineCC:            Number(form.engineCC)  || undefined,
      powerKW:             Number(form.powerKW)   || undefined,
      transmissionType:    form.transmissionType,
      mileage:             Number(form.mileage)   || 0,
      availabilityStatus:  form.availabilityStatus as Vehicle['availabilityStatus'],
      locationId:          Number(form.locationId),
      notes:               form.notes || undefined,
      halfDayPrice:        form.halfDayPrice ? Number(form.halfDayPrice) : undefined,
      fullDayPrice:        form.fullDayPrice ? Number(form.fullDayPrice) : undefined,
      weekendPrice:        form.weekendPrice ? Number(form.weekendPrice) : undefined,
      weekPrice:           form.weekPrice    ? Number(form.weekPrice)    : undefined,
      monthPrice:          form.monthPrice   ? Number(form.monthPrice)   : undefined,
    };

    const res = editVehicle
      ? await fetch(`/api/vehicles/${editVehicle.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
      : await fetch('/api/vehicles', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

    if (res.ok) { setDialogOpen(false); load(); }
    setSaving(false);
  }

  async function handleDelete(id: number) {
    await fetch(`/api/vehicles/${id}`, { method: 'DELETE' });
    setDeleteId(null);
    load();
  }

  const field = (key: keyof VehicleFormData, value: string) =>
    setForm(f => ({ ...f, [key]: value }));

  const statusBadge = (status: string) => {
    if (status === 'available')   return <Badge variant="available">Beschikbaar</Badge>;
    if (status === 'rented')      return <Badge variant="reserved">Verhuurd</Badge>;
    if (status === 'reserved')    return <Badge variant="reserved">Gereserveerd</Badge>;
    if (status === 'maintenance') return <Badge variant="maintenance">Onderhoud</Badge>;
    return <Badge variant="unavailable">Niet beschikbaar</Badge>;
  };

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[#494949]">Voertuigen ({vehicles.length})</h2>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> Nieuw voertuig
        </Button>
      </div>

      <div className="bg-white rounded-lg border border-[#d6d6d6] overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-[#f3f3f3] border-b border-[#d6d6d6]">
            <tr>
              <th className="text-left px-4 py-3 text-[#616161] font-medium">Voertuig</th>
              <th className="text-left px-4 py-3 text-[#616161] font-medium">Kenteken</th>
              <th className="text-left px-4 py-3 text-[#616161] font-medium">Motor</th>
              <th className="text-right px-4 py-3 text-[#616161] font-medium">½dag</th>
              <th className="text-right px-4 py-3 text-[#616161] font-medium">Dag</th>
              <th className="text-right px-4 py-3 text-[#616161] font-medium">Week</th>
              <th className="text-left px-4 py-3 text-[#616161] font-medium">Status</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#d6d6d6]">
            {vehicles.map(v => (
              <tr key={v.id} className="hover:bg-[#f9f9f9]">
                <td className="px-4 py-3">
                  <div className="font-medium text-[#494949]">{v.year} {v.brand} {v.model}</div>
                  <div className="text-xs text-[#616161]">{v.type} · {v.seats} zitpl. · {v.transmissionType}</div>
                </td>
                <td className="px-4 py-3 text-[#616161] font-mono text-xs">{v.licensePlate}</td>
                <td className="px-4 py-3 text-[#616161]">{v.engineTypeName || '—'}</td>
                <td className="px-4 py-3 text-right text-[#494949]">
                  {v.halfDayPrice ? `€${Number(v.halfDayPrice).toFixed(0)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-[#494949]">
                  {v.fullDayPrice ? `€${Number(v.fullDayPrice).toFixed(0)}` : '—'}
                </td>
                <td className="px-4 py-3 text-right text-[#494949]">
                  {v.weekPrice ? `€${Number(v.weekPrice).toFixed(0)}` : '—'}
                </td>
                <td className="px-4 py-3">{statusBadge(v.availabilityStatus)}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-1 justify-end">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(v)} title="Bewerken">
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(v.id)} title="Verwijderen">
                      <Trash2 className="h-3.5 w-3.5 text-red-500" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Vehicle dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editVehicle ? 'Voertuig bewerken' : 'Nieuw voertuig'}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-2">
            {([
              ['brand',       'Merk',                'text'],
              ['model',       'Model',               'text'],
              ['licensePlate','Kenteken',             'text'],
              ['year',        'Jaar',                'number'],
              ['seats',       'Zitplaatsen',         'number'],
              ['mileage',     'Kilometerstand',      'number'],
              ['engineCC',    'Motorinhoud (cc)',    'number'],
              ['powerKW',     'Vermogen (kW)',       'number'],
            ] as [keyof VehicleFormData, string, string][]).map(([k, label, type]) => (
              <div key={k} className="space-y-1">
                <Label>{label}</Label>
                <Input
                  type={type}
                  value={form[k]}
                  onChange={e => field(k, e.target.value)}
                />
              </div>
            ))}

            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={v => field('type', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['hatchback','sedan','suv','minivan','van'].map(t => (
                    <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Transmissie</Label>
              <Select value={form.transmissionType} onValueChange={v => field('transmissionType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="manual">Manueel</SelectItem>
                  <SelectItem value="automatic">Automaat</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Motortype</Label>
              <Select value={form.engineTypeId} onValueChange={v => field('engineTypeId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecteer..." /></SelectTrigger>
                <SelectContent>
                  {engineTypes.map(e => (
                    <SelectItem key={e.id} value={String(e.id)}>
                      {e.name} ({e.fuelType})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label>Status</Label>
              <Select value={form.availabilityStatus} onValueChange={v => field('availabilityStatus', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Beschikbaar</SelectItem>
                  <SelectItem value="rented">Verhuurd</SelectItem>
                  <SelectItem value="reserved">Gereserveerd</SelectItem>
                  <SelectItem value="maintenance">Onderhoud</SelectItem>
                  <SelectItem value="unavailable">Niet beschikbaar</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 col-span-2">
              <Label>Notities</Label>
              <Input
                value={form.notes}
                onChange={e => field('notes', e.target.value)}
                placeholder="Optionele opmerkingen..."
              />
            </div>

            {/* Pricing */}
            <div className="col-span-2">
              <p className="text-sm font-semibold text-[#494949] mb-3 mt-1 border-t border-[#d6d6d6] pt-3">
                Prijzen (€)
              </p>
              <div className="grid grid-cols-3 gap-3">
                {([
                  ['halfDayPrice','½ dag'],
                  ['fullDayPrice','Dag'],
                  ['weekendPrice','Weekend'],
                  ['weekPrice',  'Week'],
                  ['monthPrice', 'Maand'],
                ] as [keyof VehicleFormData, string][]).map(([k, label]) => (
                  <div key={k} className="space-y-1">
                    <Label>{label}</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={form[k]}
                      onChange={e => field(k, e.target.value)}
                      placeholder="0.00"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Annuleren</Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Opslaan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <Dialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Voertuig verwijderen</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-[#616161]">
            Weet u zeker dat u dit voertuig wilt verwijderen? Dit kan niet ongedaan worden gemaakt.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteId(null)}>Annuleren</Button>
            <Button variant="destructive" onClick={() => deleteId && handleDelete(deleteId)}>
              Verwijderen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Conversations Tab ────────────────────────────────────────────────────────

function ConversationsTab() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});

  useEffect(() => {
    fetch('/api/conversations')
      .then(r => r.json())
      .then(data => { setConversations(data); setLoading(false); });
  }, []);

  async function toggleConversation(id: string) {
    if (expanded === id) { setExpanded(null); return; }
    setExpanded(id);
    if (!messages[id]) {
      const res = await fetch(`/api/conversations?id=${encodeURIComponent(id)}`);
      const data = await res.json();
      setMessages(prev => ({ ...prev, [id]: data }));
    }
  }

  if (loading) return (
    <div className="flex justify-center py-20">
      <Loader2 className="h-8 w-8 animate-spin text-brand-600" />
    </div>
  );

  return (
    <div>
      <h2 className="text-xl font-semibold text-[#494949] mb-6">
        Gesprekken ({conversations.length})
      </h2>
      <div className="space-y-2">
        {conversations.map(conv => (
          <div key={conv.conversationId} className="bg-white rounded-lg border border-[#d6d6d6] overflow-hidden">
            <button
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-[#f9f9f9] text-left"
              onClick={() => toggleConversation(conv.conversationId)}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="h-4 w-4 text-brand-600" />
                <div>
                  <p className="text-sm font-medium text-[#494949]">
                    Gebruiker: <span className="font-mono text-xs">{conv.userId}</span>
                  </p>
                  <p className="text-xs text-[#616161]">
                    {new Date(conv.timestamp).toLocaleString('nl-BE')}
                    {' · '}
                    {conv.messageCount || 0} berichten
                  </p>
                </div>
              </div>
              {expanded === conv.conversationId
                ? <ChevronUp className="h-4 w-4 text-[#616161]" />
                : <ChevronDown className="h-4 w-4 text-[#616161]" />
              }
            </button>

            {expanded === conv.conversationId && (
              <div className="border-t border-[#d6d6d6] p-4 space-y-3 max-h-80 overflow-y-auto bg-[#f9f9f9]">
                {(messages[conv.conversationId] || []).map(msg => (
                  <div key={msg.messageId} className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${msg.role === 'user' ? 'bg-brand-600' : 'bg-[#494949]'}`}>
                      {msg.role === 'user' ? 'U' : 'A'}
                    </div>
                    <div className={`max-w-[80%] rounded-xl px-3 py-2 text-xs whitespace-pre-wrap ${msg.role === 'user' ? 'bg-brand-600 text-white' : 'bg-white border border-[#d6d6d6] text-[#494949]'}`}>
                      {msg.content}
                      {msg.llmModelUsed && (
                        <span className="block mt-1 text-[10px] opacity-50">via {msg.llmModelUsed}</span>
                      )}
                    </div>
                  </div>
                ))}
                {!messages[conv.conversationId] && (
                  <p className="text-xs text-center text-[#616161]">Laden...</p>
                )}
              </div>
            )}
          </div>
        ))}
        {conversations.length === 0 && (
          <p className="text-center text-[#616161] py-16">Nog geen gesprekken.</p>
        )}
      </div>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────

export default function AdminPage() {
  const [tab, setTab] = useState<'vehicles' | 'conversations'>('vehicles');

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#494949]">Beheerpaneel</h1>
        <p className="text-[#616161] text-sm">PeterAllesweter — Administratie</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-white border border-[#d6d6d6] rounded-lg p-1 w-fit">
        <button
          onClick={() => setTab('vehicles')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'vehicles' ? 'bg-brand-600 text-white' : 'text-[#616161] hover:text-[#494949]'
          }`}
        >
          <Car className="h-4 w-4" /> Voertuigen
        </button>
        <button
          onClick={() => setTab('conversations')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            tab === 'conversations' ? 'bg-brand-600 text-white' : 'text-[#616161] hover:text-[#494949]'
          }`}
        >
          <MessageSquare className="h-4 w-4" /> Gesprekken
        </button>
      </div>

      {tab === 'vehicles' ? <VehiclesTab /> : <ConversationsTab />}
    </div>
  );
}
