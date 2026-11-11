import { Link } from 'react-router-dom';
import { BookOpen, Sparkles, FileText, ClipboardList, BookMarked, FlaskConical, GraduationCap, ArrowRight } from 'lucide-react';
import PageHeader from '../../components/ui/PageHeader';
import Spinner from '../../components/ui/Spinner';
import ResourceCard from '../../components/resources/ResourceCard';
import { useApi } from '../../hooks/useApi';
import { RESOURCE_TYPES } from '../../utils/constants';

const typeIcons = {
  pyq: FileText,
  assignment: ClipboardList,
  assignment_guide: BookMarked,
  lab_manual: FlaskConical,
  study_material: GraduationCap,
};

const typeBlurbs = {
  pyq: 'Previous year question papers',
  assignment: 'Assignments & problem sets',
  assignment_guide: 'Step-by-step assignment guides',
  lab_manual: 'Lab manuals & practical guides',
  study_material: 'Notes, slides & study material',
};

export default function AcademicResources() {
  const { data: recs, loading: recsLoading } = useApi('/recommendations', { params: { limit: 6 } });

  return (
    <div>
      <PageHeader
        title="Academic Resources"
        description="Everything you need to study — organised by type and personalised for you."
        icon={BookOpen}
      />

      {/* Category cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {RESOURCE_TYPES.map((t) => {
          const Icon = typeIcons[t.value] || FileText;
          return (
            <Link key={t.value} to={t.route} className="card group flex items-center gap-4 p-5 transition hover:shadow-card-hover">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-600 transition group-hover:bg-brand-600 group-hover:text-white">
                <Icon size={24} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-slate-800 group-hover:text-brand-700">{t.plural}</h3>
                <p className="text-sm text-slate-500">{typeBlurbs[t.value]}</p>
              </div>
              <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-1 group-hover:text-brand-600" />
            </Link>
          );
        })}
      </div>

      {/* Recommendations */}
      <section className="mt-10">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles size={20} className="text-brand-600" />
          <h2 className="text-lg font-bold text-slate-800">Recommended for you</h2>
        </div>

        {recsLoading ? (
          <Spinner label="Personalising recommendations…" />
        ) : !recs?.length ? (
          <div className="card p-6 text-sm text-slate-500">
            Recommendations improve as you set your subjects (in your profile) and bookmark resources.
            Browse a category above to get started.
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {recs.map(({ resource, reason }) => (
              <div key={resource._id} className="flex flex-col">
                <ResourceCard resource={resource} />
                <p className="mt-1.5 px-1 text-xs italic text-brand-600">{reason}</p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
