import { GraduationCap, CalendarDays, MapPin, Clock } from "lucide-react";
import { getPublicEvent } from "@/lib/events/queries";
import { formatDate } from "@/lib/utils";
import { RegistrationForm } from "@/components/events/registration-form";

// Página PÚBLICA — não exige login (liberada no proxy via PUBLIC_ROUTES).
export default async function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getPublicEvent(id);

  const timeLabel = event
    ? [event.start_time?.slice(0, 5), event.end_time?.slice(0, 5)].filter(Boolean).join("–")
    : "";

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 flex items-center justify-center gap-2 text-indigo-700">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold">CEME Educacional</span>
        </div>

        {!event ? (
          <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
            <h1 className="text-xl font-bold text-slate-900">Inscrições indisponíveis</h1>
            <p className="mt-2 text-sm text-slate-500">
              Este evento não existe ou não está com inscrições abertas no momento.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-indigo-600 px-6 py-5 text-white">
              <h1 className="text-2xl font-bold">{event.name}</h1>
              <div className="mt-2 flex flex-wrap gap-4 text-sm text-indigo-100">
                {event.date && <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(event.date)}{timeLabel ? ` · ${timeLabel}` : ""}</span>}
                {event.location && <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {event.location}</span>}
              </div>
            </div>
            <div className="space-y-5 px-6 py-6">
              {event.description && <p className="whitespace-pre-wrap text-sm text-slate-700">{event.description}</p>}
              {event.target_audience && (
                <p className="text-sm text-slate-500"><strong>Público-alvo:</strong> {event.target_audience}</p>
              )}
              <div className="border-t border-slate-100 pt-5">
                <h2 className="mb-3 text-base font-semibold text-slate-900">Faça sua inscrição</h2>
                <RegistrationForm eventId={event.id} />
              </div>
            </div>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-slate-400">
          <Clock className="mr-1 inline h-3 w-3" /> Sistema CEME Educacional
        </p>
      </div>
    </main>
  );
}
