import React, { useState, useMemo } from 'react';
import { BRVM_SGI_LIST, SGIInfo } from '../../data/sgi-data';
import { Button } from '../ui/Button';
import {
  Building2,
  ShieldCheck,
  Smartphone,
  Globe,
  Wallet,
  Search,
  CheckCircle2,
  ExternalLink,
  Star,
  Info,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Filter,
  SlidersHorizontal,
  Coins
} from 'lucide-react';

interface SGIDirectoryModuleProps {
  onNavigate?: (path: string) => void;
}

export const SGIDirectoryModule: React.FC<SGIDirectoryModuleProps> = ({ onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>('ALL');
  const [filterMobileOnly, setFilterMobileOnly] = useState(false);
  const [filterMobileMoney, setFilterMobileMoney] = useState(false);
  const [filterLowDeposit, setFilterLowDeposit] = useState(false);

  const filteredSGIs = useMemo(() => {
    return BRVM_SGI_LIST.filter(sgi => {
      // Search term
      const matchesSearch =
        sgi.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sgi.shortName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        sgi.headquarters.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sgi.parentGroup && sgi.parentGroup.toLowerCase().includes(searchTerm.toLowerCase())) ||
        sgi.advantages.some(a => a.toLowerCase().includes(searchTerm.toLowerCase()));

      if (!matchesSearch) return false;

      // Country filter
      if (selectedCountry !== 'ALL') {
        if (selectedCountry === 'CI' && !sgi.countryCode.includes('CI')) return false;
        if (selectedCountry === 'SN' && !sgi.countryCode.includes('SN')) return false;
        if (selectedCountry === 'BF' && !sgi.countryCode.includes('BF')) return false;
        if (selectedCountry === 'BJ_TG' && !['BJ', 'TG'].includes(sgi.countryCode)) return false;
      }

      // Feature filters
      if (filterMobileOnly && !sgi.hasMobileApp) return false;
      if (filterMobileMoney && !sgi.mobileMoneySupported) return false;
      if (filterLowDeposit) {
        const depositNum = parseInt(sgi.minimumDepositEstimate.replace(/[^0-9]/g, ''), 10) || 0;
        if (depositNum > 50000) return false;
      }

      return true;
    });
  }, [searchTerm, selectedCountry, filterMobileOnly, filterMobileMoney, filterLowDeposit]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Educational Banner */}
      <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-blue-950 text-white shadow-xl border border-indigo-800/40 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-black uppercase tracking-wider border border-emerald-500/30">
              <ShieldCheck className="w-3.5 h-3.5" />
              Intermédiaires Agréés CREPMF (AMF-UMOA) & BRVM
            </div>
            <h2 className="text-xl sm:text-3xl font-black">
              Annuaire des SGI (Sociétés de Gestion & d'Intermédiation)
            </h2>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed font-medium">
              À la BRVM, vous devez obligatoirement passer par une <strong>SGI agréée</strong> pour ouvrir un compte-titres, acheter des actions et recevoir vos dividendes. Comparez les points forts, les outils digitaux et les frais de chaque courtier.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 space-y-1 min-w-[200px]">
            <span className="text-[10px] font-extrabold uppercase text-indigo-300 block">SGI Référencées</span>
            <div className="text-2xl font-black text-white">{BRVM_SGI_LIST.length} Courtiers Officiels</div>
            <div className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> 100% Régulées UEMOA
            </div>
          </div>
        </div>
      </div>

      {/* 4 Key Decision Criteria Guide */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h3 className="font-extrabold text-slate-900 text-base">
            4 Critères Essentiels pour Bien Choisir sa SGI
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black">
              1
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Application Mobile & Web</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Privilégiez une SGI proposant une application (ex: BOA Bourse, Coris Bourse, CGF Direct) pour passer vos ordres d'achat 24/7 depuis votre smartphone sans paperasse.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black">
              2
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Dépôts Mobile Money & Virement</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Si vous voulez alimenter votre compte-titres instantanément par Wave, Orange Money ou MTN, optez pour des SGI comme Coris, BOA, CGF ou Africa Bourse.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center font-black">
              3
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Seuil de Premier Dépôt</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Les seuils varient fortement : de 10 000 FCFA (Coris Bourse) ou 25 000 FCFA (BOA) pour débutants, jusqu'à 200 000 FCFA+ dans les grandes banques privées.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100 space-y-2">
            <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center font-black">
              4
            </div>
            <h4 className="font-bold text-slate-900 text-sm">Analyses & Conseils de Recherche</h4>
            <p className="text-slate-600 leading-relaxed font-medium">
              Les meilleures SGI transmettent chaque semaine des rapports d'analyse financière gratuits et des recommandations d'achat/vente à leurs clients.
            </p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Rechercher une SGI par nom, groupe (BOA, Coris, NSIA, CGF...) ou avantage..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 outline-none focus:border-blue-500"
            />
          </div>

          {/* Country Selector Filter */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0 text-xs font-extrabold">
            <span className="text-slate-400 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" /> Pays:
            </span>
            <button
              onClick={() => setSelectedCountry('ALL')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCountry === 'ALL'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setSelectedCountry('CI')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCountry === 'CI'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇨🇮 Côte d'Ivoire
            </button>
            <button
              onClick={() => setSelectedCountry('SN')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCountry === 'SN'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇸🇳 Sénégal
            </button>
            <button
              onClick={() => setSelectedCountry('BF')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCountry === 'BF'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇧🇫 Burkina Faso
            </button>
            <button
              onClick={() => setSelectedCountry('BJ_TG')}
              className={`px-3 py-2 rounded-xl transition-all cursor-pointer whitespace-nowrap ${
                selectedCountry === 'BJ_TG'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🇧🇯 🇹🇬 Bénin / Togo
            </button>
          </div>
        </div>

        {/* Feature Checkbox Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs font-extrabold">
          <span className="text-slate-400 flex items-center gap-1 mr-1">
            <SlidersHorizontal className="w-3.5 h-3.5" /> Filtres rapides:
          </span>

          <button
            onClick={() => setFilterMobileOnly(!filterMobileOnly)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              filterMobileOnly
                ? 'bg-blue-50 border-blue-600 text-blue-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Smartphone className="w-3.5 h-3.5 text-blue-600" />
            App Mobile Disponible
          </button>

          <button
            onClick={() => setFilterMobileMoney(!filterMobileMoney)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              filterMobileMoney
                ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Wallet className="w-3.5 h-3.5 text-emerald-600" />
            Rechargement Mobile Money
          </button>

          <button
            onClick={() => setFilterLowDeposit(!filterLowDeposit)}
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 cursor-pointer transition-all ${
              filterLowDeposit
                ? 'bg-purple-50 border-purple-600 text-purple-800'
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Coins className="w-3.5 h-3.5 text-purple-600" />
            Dépôt &le; 50 000 FCFA (Débutants)
          </button>

          {(searchTerm || selectedCountry !== 'ALL' || filterMobileOnly || filterMobileMoney || filterLowDeposit) && (
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCountry('ALL');
                setFilterMobileOnly(false);
                setFilterMobileMoney(false);
                setFilterLowDeposit(false);
              }}
              className="px-2.5 py-1 text-[11px] text-rose-600 hover:underline font-bold ml-auto cursor-pointer"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>
      </div>

      {/* SGI Cards List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSGIs.length > 0 ? (
          filteredSGIs.map(sgi => (
            <div
              key={sgi.id}
              className={`p-6 rounded-2xl border transition-all space-y-4 bg-white flex flex-col justify-between ${
                sgi.featured
                  ? 'border-blue-300 shadow-md ring-1 ring-blue-100'
                  : 'border-slate-200/80 shadow-xs hover:border-slate-300'
              }`}
            >
              <div className="space-y-4">
                {/* Header Info */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-900">{sgi.name}</h3>
                      {sgi.featured && (
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[10px] flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500 text-amber-500" /> Top Recommandé
                        </span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 font-semibold mt-1">
                      <span className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" /> {sgi.headquarters}
                      </span>
                      {sgi.parentGroup && (
                        <span className="text-slate-400">({sgi.parentGroup})</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-extrabold uppercase text-slate-400 block">Note Avis</span>
                    <div className="flex items-center gap-1 text-sm font-black text-slate-900">
                      <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                      {sgi.rating.toFixed(1)} / 5
                    </div>
                  </div>
                </div>

                {/* Features & Key Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl text-xs font-semibold">
                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Dépôt Minimum</span>
                    <span className="font-extrabold text-blue-900">{sgi.minimumDepositEstimate}</span>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Frais de Courtage</span>
                    <span className="font-bold text-slate-800">{sgi.brokerageFeeEstimate}</span>
                  </div>

                  <div className="col-span-2 sm:col-span-1">
                    <span className="text-[10px] uppercase text-slate-400 font-bold block">Plateformes</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      {sgi.hasMobileApp ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded-md">
                          <Smartphone className="w-3 h-3" /> App
                        </span>
                      ) : null}
                      {sgi.hasWebPortal ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-md">
                          <Globe className="w-3 h-3" /> Web
                        </span>
                      ) : null}
                      {sgi.mobileMoneySupported ? (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded-md">
                          <Wallet className="w-3 h-3" /> Mobile Money
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                {/* Advantages List */}
                <div className="space-y-2">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Avantages Clés & Points Forts :
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-600 leading-relaxed font-medium">
                    {sgi.advantages.map((adv, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                        <span>{adv}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Target Audience */}
                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100/60 text-xs text-blue-950 font-medium">
                  <strong className="text-blue-900 block mb-0.5">Profil Idéal :</strong>
                  {sgi.targetAudience}
                </div>
              </div>

              {/* Action Button */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                <div className="text-[11px] text-slate-400 font-medium">
                  Portail : <strong className="text-slate-700">{sgi.onlinePlatformName}</strong>
                </div>

                {sgi.websiteUrl && (
                  <a
                    href={sgi.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-900 hover:underline"
                  >
                    Site Officiel SGI
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Info className="w-10 h-10 text-slate-400 mx-auto" />
            <h4 className="font-bold text-slate-800 text-base">Aucune SGI ne correspond à vos filtres actuels</h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Essayez de réinitialiser la recherche ou de sélectionner un autre pays d'implantation.
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setSelectedCountry('ALL');
                setFilterMobileOnly(false);
                setFilterMobileMoney(false);
                setFilterLowDeposit(false);
              }}
            >
              Effacer tous les filtres
            </Button>
          </div>
        )}
      </div>

      {/* Bottom Educational Callout */}
      <div className="p-6 rounded-3xl bg-amber-50 border border-amber-200 text-amber-950 space-y-3">
        <div className="flex items-center gap-2 font-black text-amber-900 text-sm">
          <HelpCircle className="w-5 h-5 text-amber-700" />
          Comment ouvrir un compte-titres auprès d'une SGI en 3 étapes ?
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-medium">
          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="font-extrabold text-amber-900 block">1. Pièces justificatives :</span>
            <p className="text-amber-900/90 leading-relaxed">
              Préparez votre CNI / Passeport valide, un justificatif de domicile (facture CIE/SODECI ou Senelec) et 2 photos d'identité.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="font-extrabold text-amber-900 block">2. Inscription en ligne :</span>
            <p className="text-amber-900/90 leading-relaxed">
              Téléchargez l'application de la SGI choisie (ex: BOA Bourse, Coris Bourse, CGF Bourse) et remplissez le formulaire KYC numérisé.
            </p>
          </div>

          <div className="p-3 bg-white/80 rounded-2xl border border-amber-200/80 space-y-1">
            <span className="font-extrabold text-amber-900 block">3. Premier dépôt & passage d'ordre :</span>
            <p className="text-amber-900/90 leading-relaxed">
              Alimentez votre compte par Mobile Money ou virement, puis passez votre premier ordre d'achat sur des actions comme Sonatel, SGBCI ou Orange.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
