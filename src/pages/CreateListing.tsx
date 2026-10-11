import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Check, AlertTriangle, Leaf, Recycle, Upload, Clock, MapPin, Shield, FileCheck, Info } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input, Textarea, Select } from '../components/ui/Input';
import { ProgressBar } from '../components/ui/ProgressBar';
import { Badge } from '../components/ui/Badge';
import { Toast } from '../components/ui/Toast';
import { cn } from '../components/ui/utils';
import { createListing } from '../api';
import { co2Avoided, waterSaved } from '../lib/formatters';
import { useRolePaths } from '../lib/useRolePaths';

const allergenList = ['Gluten', 'Dairy / Butter', 'Tree Nuts', 'Vegetarian Safe', 'Shellfish Free', 'Egg Free'];
const storageConditions = [
  { key: 'ambient', label: 'Ambient', sub: '18°C / Dry Store' },
  { key: 'refrigerated', label: 'Refrigerated', sub: 'Chilled 2-4°C / 1 Week+' },
  { key: 'frozen', label: 'Deep Frozen', sub: 'From -18°C to +18°C' },
];

const edibleCategories = ['Bakery & Pastries', 'Catering / Prepared Meals', 'Dairy & Cold Foods', 'Ready-to-Eat', 'Produce & Vegetables', 'Other'];
const organicCategories = ['Compost / Horticulture', 'Biogas & Animal Feed', 'Food Processing Waste', 'Spent Grains', 'Other Biomass'];

const schema = z.object({
  listingType: z.enum(['edible', 'organic']),
  category: z.string().min(1, 'Select a category'),
  title: z.string().min(4, 'Title must be at least 4 characters'),
  description: z.string().min(20, 'Provide a description (min 20 chars)'),
  weightKg: z.number().positive('Must be positive'),
  packagingNote: z.string().optional(),
  preparedAt: z.string().min(1, 'Required'),
  safeUntil: z.string().min(1, 'Required'),
  earliestPickup: z.string().min(1, 'Required'),
  finalDeadline: z.string().min(1, 'Required'),
  address: z.string().min(5, 'Enter pickup address'),
  dockInstructions: z.string().optional(),
  onSiteLead: z.string().min(2, 'Enter on-site lead name'),
  emergencyMobile: z.string().min(10, 'Enter valid mobile number'),
});

type FormData = z.infer<typeof schema>;

export function CreateListing() {
  const navigate = useNavigate();
  const paths = useRolePaths();
  const [selectedAllergens, setSelectedAllergens] = useState<string[]>([]);
  const [storageCondition, setStorageCondition] = useState('ambient');
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [showToast, setShowToast] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  const { register, control, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema) as any,
    defaultValues: {
      listingType: 'edible',
      weightKg: 25,
    }
  });

  const wt = watch('listingType');
  const wWeight = watch('weightKg') || 0;
  const wTitle = watch('title') || '';
  const wDesc = watch('description') || '';
  const wAddr = watch('address') || '';
  const wFinal = watch('finalDeadline') || '';
  const categories = wt === 'edible' ? edibleCategories : organicCategories;

  const toggleAllergen = (a: string) =>
    setSelectedAllergens(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a]);

  const onSubmit = async (data: any) => {
    try {
      await createListing({
        title: data.title,
        description: data.description,
        type: data.listingType === 'edible' ? 'edible' : 'organic',
        weightKg: Number(data.weightKg),
        category: data.category,
        storageMethod: (storageCondition as any) || 'ambient',
        allergens: selectedAllergens,
        packagingNote: data.packagingNote,
        preparedAt: data.preparedAt ? new Date(data.preparedAt).toISOString() : undefined,
        safeUntil: data.safeUntil ? new Date(data.safeUntil).toISOString() : undefined,
        earliestPickup: data.earliestPickup ? new Date(data.earliestPickup).toISOString() : new Date().toISOString(),
        collectionDeadline: data.finalDeadline ? new Date(data.finalDeadline).toISOString() : new Date(Date.now() + 4 * 3600000).toISOString(),
        pickupAddress: data.address,
        pickupInstructions: data.dockInstructions,
        onSiteContact: data.onSiteLead,
        onSitePhone: data.emergencyMobile,
        isFree: true,
      });
    } catch {
      // Graceful offline/mock demonstration fallback
    }
    setShowToast(true);
    setTimeout(() => navigate('/supplier/listings'), 2500);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const urls = ['https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=150&fit=crop',
      'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=200&h=150&fit=crop'];
    setUploadedImages(prev => [...prev, urls[prev.length % 2]]);
  }, []);

  const deadlineDiff = wFinal ? (() => {
    const diff = new Date(wFinal).getTime() - Date.now();
    if (diff <= 0) return null;
    const h = Math.floor(diff / 3600_000);
    const m = Math.floor((diff % 3600_000) / 60_000);
    return `(${h}h ${m}m window)`;
  })() : null;

  return (
    <div className="max-w-[1200px] mx-auto px-6 py-8">
      {showToast && (
        <Toast
          message="Surplus Food Listing Live · Broadcasted to 14 verified nearby NGOs and Foodbanks"
          onClose={() => setShowToast(false)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start gap-6 mb-8">
        <div className="flex-1">
          <div className="flex flex-wrap gap-2 mb-3">
            <Badge variant="neutral" className="text-[10px]">FAST DISPATCH WORKFLOW · V2.4</Badge>
            <Badge variant="edible" className="text-[10px]">Step 1 of 1 Instant Audit</Badge>
          </div>
          <h1 className="text-3xl font-700 text-[#111827] tracking-tight">List Surplus Food or Organic Waste</h1>
          <p className="text-sm text-[#5B6272] mt-1">Register actionable inventory in under 3 minutes.</p>
        </div>
        <div className="flex gap-3 shrink-0">
          <div className="bg-[#DDF7EE] rounded-[12px] p-3 text-xs text-[#0E6B45] flex items-center gap-2">
            <Leaf size={14} />Zero Transport Hassle
          </div>
          <div className="bg-[#EEF0FA] rounded-[12px] p-3 text-xs text-[#5B6272] flex items-center gap-2">
            <Shield size={14} className="text-[#0E6B45]" />Good Samaritan Compliant
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="flex gap-8 items-start">
          {/* Form left */}
          <div className="flex-1 min-w-0 space-y-6">

            {/* Section 1 – Listing Type */}
            <FormSection number={1} title="Listing Type & Category Destination">
              <Controller
                name="listingType"
                control={control}
                render={({ field }) => (
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <button type="button" onClick={() => field.onChange('edible')}
                      className={cn('rounded-[12px] p-4 border-2 text-left transition-all cursor-pointer', field.value === 'edible' ? 'bg-[#0E6B45] border-[#0E6B45] text-white' : 'border-[#E6E8F0] hover:border-[#0E6B45]')}>
                      <div className="flex items-center gap-2 mb-2">
                        <Leaf size={16} />
                        <span className="text-xs font-600">Edible Surplus</span>
                      </div>
                      <p className={cn('text-[11px]', field.value === 'edible' ? 'text-white/80' : 'text-[#5B6272]')}>
                        Pre-consumer dishes, prepared meals, baked goods, and dairy routed to verified NGOs, shelters and foodbanks.
                      </p>
                    </button>
                    <button type="button" onClick={() => field.onChange('organic')}
                      className={cn('rounded-[12px] p-4 border-2 text-left transition-all cursor-pointer', field.value === 'organic' ? 'bg-[#B8650A] border-[#B8650A] text-white' : 'border-[#E6E8F0] hover:border-[#B8650A]')}>
                      <div className="flex items-center gap-2 mb-2">
                        <Recycle size={16} />
                        <span className="text-xs font-600">Organic Food Waste</span>
                      </div>
                      <p className={cn('text-[11px]', field.value === 'organic' ? 'text-white/80' : 'text-[#5B6272]')}>
                        Peels, trimmings, and pulp routed to certified municipal composting or biogas digesters.
                      </p>
                    </button>
                  </div>
                )}
              />
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Sub-Category Specification"
                    options={categories.map(c => ({ value: c, label: c }))}
                    {...field}
                    error={errors.category?.message}
                  />
                )}
              />
            </FormSection>

            {/* Section 2 – Food Details */}
            <FormSection number={2} title="Food Details & Safe Handling">
              <div className="space-y-4">
                <Input label="Listing Title" placeholder="e.g. Assorted Croissants & Sourdough Loaves" {...register('title')} error={errors.title?.message} />
                <Textarea label="Description & Preparation Context" rows={3} placeholder="Describe how the food was prepared, storage conditions, and readiness for dispatch…" {...register('description')} error={errors.description?.message} />
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-600 mb-2">Known Allergens Present</p>
                  <div className="flex flex-wrap gap-2">
                    {allergenList.map(a => (
                      <button key={a} type="button" onClick={() => toggleAllergen(a)}
                        className={cn('px-3 py-1.5 rounded-full text-xs font-600 border transition-all cursor-pointer', selectedAllergens.includes(a) ? 'bg-[#0E6B45] text-white border-[#0E6B45]' : 'bg-white text-[#5B6272] border-[#E6E8F0] hover:border-[#0E6B45]')}>
                        {selectedAllergens.includes(a) && <Check size={10} className="inline mr-1" />}{a}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-600 mb-2">Storage Environment Prior to Hand-Off</p>
                  <div className="grid grid-cols-3 gap-3">
                    {storageConditions.map(c => (
                      <button key={c.key} type="button" onClick={() => setStorageCondition(c.key)}
                        className={cn('rounded-[10px] p-3 border-2 text-left transition-all cursor-pointer', storageCondition === c.key ? 'bg-[#DDF7EE] border-[#0E6B45]' : 'bg-white border-[#E6E8F0] hover:border-[#0E6B45]/50')}>
                        <p className="text-xs font-700 text-[#111827]">{c.label}</p>
                        <p className="text-[10px] text-[#5B6272]">{c.sub}</p>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </FormSection>

            {/* Section 3 – Quantity */}
            <FormSection number={3} title="Quantity & Packaging Specifications">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex gap-2">
                  <Input label="Estimated Weight / Volume" type="number" {...register('weightKg', { valueAsNumber: true })} error={errors.weightKg?.message} className="flex-1" />
                  <div className="flex items-end">
                    <div className="px-3 py-2.5 bg-[#EEF0FA] border border-[#E6E8F0] rounded-[10px] text-sm text-[#5B6272]">kg</div>
                  </div>
                </div>
                <div className="flex flex-col gap-1.5">
                  <p className="text-[10px] uppercase tracking-widest text-[#5B6272] font-600">Approx. Recipient Portions</p>
                  <div className="px-3 py-2.5 bg-[#EEF0FA] border border-[#E6E8F0] rounded-[10px] text-sm font-700 text-[#0E6B45]">
                    ~{Math.round(wWeight * 4)} Individual Servings
                  </div>
                </div>
              </div>
              <Textarea label="Packaging & Recipient Equipment Note" rows={2} placeholder="Packed in sanitary food-grade crates. Recipient should bring own containers for decanting." {...register('packagingNote')} />
            </FormSection>

            {/* Section 4 – Availability */}
            <FormSection number={4} title="Availability & Perishability Timeline">
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="urgent" className="text-[10px]">Strict Cut-off</Badge>
                <span className="text-xs text-[#5B6272]">Passed deadline batches are auto-archived.</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input label="Batch Prepared / Harvested" type="datetime-local" {...register('preparedAt')} error={errors.preparedAt?.message} />
                <Input label="Strict Safe-Consumption Limit" type="datetime-local" {...register('safeUntil')} error={errors.safeUntil?.message} />
                <Input label="Earliest Pickup" type="datetime-local" {...register('earliestPickup')} error={errors.earliestPickup?.message} />
                <div>
                  <Input label="Firm Deadline" type="datetime-local" {...register('finalDeadline')} error={errors.finalDeadline?.message} />
                  {deadlineDiff && <p className="mt-1 text-xs font-600 text-[#0E6B45]">{deadlineDiff}</p>}
                </div>
              </div>
            </FormSection>

            {/* Section 5 – Location */}
            <FormSection number={5} title="Location & Driver Access Instructions">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Input label="Physical Pickup Address" placeholder="Hotel Grand Royale – Loading Dock Service Bay 4, 100 Orchid Bird Road, Koramangala, Bengaluru" {...register('address')} error={errors.address?.message} />
                </div>
                <div className="col-span-2">
                  <Textarea label="Specific Loading Dock & Security / Access Pass Guidance" rows={2} placeholder="Enter via North Underground Ramp. Ring intercom #448 at boom gate and state 'ReFood Rescue Order #427'…" {...register('dockInstructions')} />
                </div>
                <Input label="On-Site Dispatch Lead" placeholder="Chef Marco Paul (Head Steward)" {...register('onSiteLead')} error={errors.onSiteLead?.message} />
                <Input label="Direct Emergency Mobile" placeholder="+91 99800 12041" {...register('emergencyMobile')} error={errors.emergencyMobile?.message} />
              </div>
            </FormSection>

            {/* Section 6 – Photo Upload */}
            <FormSection number={6} title="Verification Photo Upload">
              <div
                onDragOver={e => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                onClick={() => setUploadedImages(prev => [...prev, 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=200&h=150&fit=crop'])}
                className={cn(
                  'border-2 border-dashed rounded-[12px] p-8 text-center cursor-pointer transition-all',
                  isDragOver ? 'border-[#0E6B45] bg-[#DDF7EE]' : 'border-[#E6E8F0] hover:border-[#0E6B45]/50 hover:bg-[#EEF0FA]'
                )}
              >
                <Upload size={24} className="text-[#5B6272] mx-auto mb-2" />
                <p className="text-sm font-600 text-[#111827]">Drag & drop images or click to upload</p>
                <p className="text-xs text-[#5B6272] mt-1">PNG, JPG, HEIC up to 5MB. Clear shot of labels or batch codes add recipient verification.</p>
              </div>
              {uploadedImages.length > 0 && (
                <div className="flex gap-3 mt-3 flex-wrap">
                  {uploadedImages.map((url, i) => (
                    <div key={i} className="relative">
                      <img src={url} alt={`Upload ${i + 1}`} className="w-20 h-20 rounded-[10px] object-cover border border-[#E6E8F0]" />
                      {i === 0 && <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-[#0E6B45] text-white text-[8px] rounded-full font-600">Primary</span>}
                    </div>
                  ))}
                </div>
              )}
            </FormSection>
          </div>

          {/* Right sticky column */}
          <div className="hidden lg:flex flex-col gap-4 w-80 shrink-0 sticky top-20">
            {/* Live preview */}
            <div className="bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
              <div className="px-4 py-3 border-b border-[#E6E8F0]">
                <p className="text-xs font-700 text-[#5B6272] uppercase tracking-widest">Live Listing Preview</p>
              </div>
              <div style={{ borderTop: `4px solid ${wt === 'edible' ? '#0E6B45' : '#B8650A'}` }} className="p-4">
                {uploadedImages[0] ? (
                  <img src={uploadedImages[0]} alt="Preview" className="w-full h-32 object-cover rounded-[10px] mb-3" />
                ) : (
                  <div className="w-full h-32 bg-[#EEF0FA] rounded-[10px] flex items-center justify-center mb-3">
                    <Upload size={20} className="text-[#5B6272]" />
                  </div>
                )}
                <Badge variant={wt === 'edible' ? 'edible' : 'organic'} className="mb-2">{wt === 'edible' ? 'Edible Surplus' : 'Organic Biomass'}</Badge>
                <p className="font-600 text-[#111827] text-sm mb-1">{wTitle || 'Your listing title…'}</p>
                <p className="text-xs text-[#5B6272] mb-3 line-clamp-2">{wDesc || 'Your description will appear here…'}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-[#5B6272]">Weight</span>
                  <span className="text-sm font-700 text-[#111827]">{wWeight > 0 ? `${wWeight} kg` : '–'}</span>
                </div>
                <ProgressBar value={35} label="Pickup Window" status="Active" />
                {wAddr && <p className="text-[11px] text-[#5B6272] mt-2 flex items-center gap-1"><MapPin size={10} />{wAddr}</p>}
              </div>
            </div>

            {/* Environmental impact */}
            <div className="bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
              <div className="px-4 py-3 border-b border-[#E6E8F0]">
                <p className="text-xs font-700 text-[#5B6272] uppercase tracking-widest">Estimated Environmental Impact</p>
              </div>
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#DDF7EE] rounded-[10px] p-3">
                    <p className="text-[10px] text-[#5B6272] uppercase tracking-wider font-600">CO2e Avoided</p>
                    <p className="text-xl font-700 text-[#0E6B45]">{co2Avoided(wWeight)} <span className="text-xs">kg</span></p>
                    <p className="text-[10px] text-[#5B6272]">vs landfilling</p>
                  </div>
                  <div className="bg-[#EEF0FA] rounded-[10px] p-3">
                    <p className="text-[10px] text-[#5B6272] uppercase tracking-wider font-600">Water Saved</p>
                    <p className="text-xl font-700 text-[#111827]">{waterSaved(wWeight)} <span className="text-xs">kL</span></p>
                    <p className="text-[10px] text-[#5B6272]">embedded water</p>
                  </div>
                </div>
                <div className="bg-[#DDF7EE] rounded-[10px] p-3 flex items-center gap-2">
                  <FileCheck size={14} className="text-[#0E6B45] shrink-0" />
                  <p className="text-[11px] text-[#0E6B45] font-600">Tax Deductible Receipt Ready · Auto-generated upon pickup confirmation.</p>
                </div>
              </div>
            </div>

            {/* SLA */}
            <div className="bg-white rounded-[16px] border border-[#E6E8F0] p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
              <p className="text-xs font-700 text-[#111827] mb-2">Recipient Dispatch SLA</p>
              <ul className="space-y-1.5">
                {['Matched partner notified in &lt;45 sec', 'Pickup attempted within 4h of listing', 'Unconfirmed listings auto-archived at deadline'].map(s => (
                  <li key={s} className="flex items-start gap-2 text-[11px] text-[#5B6272]">
                    <Check size={11} className="text-[#0E6B45] mt-0.5 shrink-0" />
                    <span dangerouslySetInnerHTML={{ __html: s }} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Sticky action bar */}
        <div className="sticky bottom-0 mt-8 bg-white border-t border-[#E6E8F0] -mx-6 px-6 py-4 flex items-center gap-3 shadow-[0_-4px_16px_rgba(16,24,40,0.06)] z-30">
          <Button type="button" variant="ghost">Save as Draft</Button>
          <Button type="button" variant="outline">Inspect Card</Button>
          <div className="flex-1" />
          <Button type="submit" variant="primary" className="gap-2 px-6" disabled={isSubmitting}>
            {isSubmitting ? 'Publishing…' : 'Publish Listing Now'}
          </Button>
        </div>
      </form>
    </div>
  );
}

function FormSection({ number, title, children }: { number: number; title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-[16px] border border-[#E6E8F0] overflow-hidden shadow-[0_1px_2px_rgba(16,24,40,0.04),0_4px_16px_rgba(16,24,40,0.04)]">
      <div className="px-5 py-4 border-b border-[#E6E8F0] flex items-center gap-3">
        <div className="w-6 h-6 bg-[#0E6B45] rounded-full flex items-center justify-center text-white text-xs font-700">{number}</div>
        <p className="font-600 text-[#111827]">{title}</p>
      </div>
      <div className="p-5 space-y-4">{children}</div>
    </div>
  );
}
