import { Company, Quote } from '../../src/types';
import { HistoricalPrice } from '../providers/MarketDataProvider';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  anomalies: string[];
}

export class MarketDataValidator {
  public static validateCompany(company: Partial<Company>): ValidationResult {
    const errors: string[] = [];
    const anomalies: string[] = [];

    if (!company.symbol || company.symbol.trim().length === 0) {
      errors.push("Le symbole de l'entreprise est obligatoire.");
    }

    if (!company.name || company.name.trim().length === 0) {
      errors.push("Le nom de l'entreprise est obligatoire.");
    }

    if (!company.source || company.source.trim().length === 0) {
      errors.push("La source de la donnée est obligatoire.");
    }

    if (!company.lastUpdated || isNaN(Date.parse(company.lastUpdated))) {
      errors.push("La date de collecte / mise à jour est invalide ou manquante.");
    }

    if (company.currentPrice === undefined || company.currentPrice === null || company.currentPrice <= 0) {
      errors.push("Le cours actuel de l'action doit être un nombre strictement positif (> 0 FCFA).");
    }

    if (company.previousClose !== undefined && company.previousClose <= 0) {
      anomalies.push("Le cours de clôture précédent est nul ou négatif.");
    }

    if (company.eps !== undefined && company.eps < 0) {
      anomalies.push("BPA négatif détecté (perte comptable enregistrée par l'entreprise).");
    }

    if (company.eps !== undefined && company.eps > 0 && company.currentPrice && company.per) {
      const expectedPer = parseFloat((company.currentPrice / company.eps).toFixed(2));
      if (Math.abs(expectedPer - company.per) > 0.5) {
        anomalies.push(`Incohérence détectée sur le PER: calculé=${expectedPer}, fourni=${company.per}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      anomalies,
    };
  }

  public static validateQuote(quote: Partial<Quote>): ValidationResult {
    const errors: string[] = [];
    const anomalies: string[] = [];

    if (!quote.symbol || quote.symbol.trim().length === 0) {
      errors.push("Le symbole de cotation est obligatoire.");
    }

    if (!quote.source || quote.source.trim().length === 0) {
      errors.push("La source officielle de la cotation est obligatoire.");
    }

    if (!quote.timestamp || isNaN(Date.parse(quote.timestamp))) {
      errors.push("La date/heure de collecte de la cotation est invalide.");
    }

    if (quote.price === undefined || quote.price <= 0) {
      errors.push("Le cours exécuté doit être un prix strictement positif (> 0 FCFA).");
    }

    if (quote.volume !== undefined && quote.volume < 0) {
      errors.push("Le volume d'échange ne peut pas être négatif.");
    }

    if (quote.high !== undefined && quote.low !== undefined) {
      if (quote.high < quote.low) {
        errors.push(`Incohérence des cours de la journée: Plus Haut (${quote.high}) inférieur au Plus Bas (${quote.low}).`);
      }
    }

    if (quote.price !== undefined && quote.high !== undefined && quote.low !== undefined) {
      if (quote.price > quote.high || quote.price < quote.low) {
        anomalies.push(`Le cours exécuté (${quote.price}) est en dehors de la plage Plus Haut/Plus Bas [${quote.low} - ${quote.high}].`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      anomalies,
    };
  }

  public static validateHistoricalPrice(
    price: Partial<HistoricalPrice>,
    existingPrices: HistoricalPrice[] = []
  ): ValidationResult {
    const errors: string[] = [];
    const anomalies: string[] = [];

    if (!price.symbol || price.symbol.trim().length === 0) {
      errors.push("Le symbole est obligatoire pour l'historique de prix.");
    }

    if (!price.date || isNaN(Date.parse(price.date))) {
      errors.push("La date de cotation est invalide.");
    }

    if (!price.source || price.source.trim().length === 0) {
      errors.push("La source de la donnée historique est obligatoire.");
    }

    if (price.close === undefined || price.close <= 0) {
      errors.push("Le cours de clôture doit être positif (> 0).");
    }

    if (price.volume !== undefined && price.volume < 0) {
      errors.push("Le volume de transaction ne peut pas être négatif.");
    }

    if (price.high !== undefined && price.low !== undefined && price.high < price.low) {
      errors.push(`Incohérence des extrêmes: High (${price.high}) < Low (${price.low}).`);
    }

    // Duplicate company-date check!
    if (price.symbol && price.date) {
      const targetDateStr = new Date(price.date).toISOString().split('T')[0];
      const isDuplicate = existingPrices.some(
        p => p.symbol === price.symbol && new Date(p.date).toISOString().split('T')[0] === targetDateStr
      );

      if (isDuplicate) {
        errors.push(`Doublon interdit: Une entrée de cours existe déjà pour ${price.symbol} à la date du ${targetDateStr}.`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      anomalies,
    };
  }
}
