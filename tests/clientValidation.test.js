import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CLIENT_FIELDS, clientPayload, normalizeClient, validateClient } from '../shared/clientValidation.js'

const CLIENT_SAMPLE = {
  name: 'Atlas Distribution',
  company: 'Atlas SARL',
  email: 'contact@atlas.dz',
  phone: '0550 12 34 56',
  address: '12 rue Didouche Mourad, Alger',
  nif: '123456789012345',
  rc: '16/00-1234567B12',
}

describe('normalizeClient', () => {
  it('supprime les espaces autour de l’e-mail et dans le NIF', () => {
    assert.deepEqual(normalizeClient({ email: '  contact@exemple.dz ', nif: '123 456 789 012 345' }), {
      email: 'contact@exemple.dz',
      nif: '123456789012345',
    })
  })

  it('tolère les valeurs absentes', () => {
    assert.deepEqual(normalizeClient({}), { email: '', nif: '' })
    assert.deepEqual(normalizeClient(undefined), { email: '', nif: '' })
  })
})

describe('validateClient — nom', () => {
  it('exige un nom non vide', () => {
    assert.equal(validateClient({}).name, 'Le nom du client est obligatoire.')
    assert.equal(validateClient({ name: '   ' }).name, 'Le nom du client est obligatoire.')
  })

  it('accepte un nom valide sans autre erreur', () => {
    assert.deepEqual(validateClient({ name: 'Atlas Distribution' }), {})
  })
})

describe('validateClient — e-mail', () => {
  it('accepte un e-mail vide (champ facultatif)', () => {
    assert.deepEqual(validateClient({ name: 'Atlas', email: '' }), {})
  })

  it('accepte les e-mails valides', () => {
    for (const email of ['contact@exemple.dz', 'a.b+facture@mon-entreprise.com']) {
      assert.deepEqual(validateClient({ name: 'Atlas', email }), {}, email)
    }
  })

  it('refuse les e-mails mal formés', () => {
    const invalidEmails = ['contact', 'contact@', '@exemple.dz', 'contact@exemple', 'contact@exemple.c', 'a b@exemple.dz']
    for (const email of invalidEmails) {
      assert.ok(validateClient({ name: 'Atlas', email }).email, email)
    }
  })

  it('ignore les espaces autour de l’e-mail avant validation', () => {
    assert.deepEqual(validateClient({ name: 'Atlas', email: '  contact@exemple.dz  ' }), {})
  })
})

describe('validateClient — NIF', () => {
  it('accepte un NIF de 15 chiffres, espaces compris', () => {
    assert.deepEqual(validateClient({ name: 'Atlas', nif: '123456789012345' }), {})
    assert.deepEqual(validateClient({ name: 'Atlas', nif: '123 456 789 012 345' }), {})
  })

  it('refuse une longueur ou un contenu incorrects', () => {
    for (const nif of ['12345678901234', '1234567890123456', '12345678901234A', 'abcdefghijklmno']) {
      assert.equal(validateClient({ name: 'Atlas', nif }).nif, 'Le NIF doit comporter exactement 15 chiffres.', nif)
    }
  })
})

describe('validateClient — cumul des erreurs', () => {
  it('retourne une erreur par champ invalide', () => {
    assert.deepEqual(validateClient({ name: '', email: 'invalide', nif: '123' }), {
      name: 'Le nom du client est obligatoire.',
      email: 'Adresse e-mail invalide (ex. contact@exemple.dz).',
      nif: 'Le NIF doit comporter exactement 15 chiffres.',
    })
  })
})

describe('clientPayload — structure envoyée à l’API', () => {
  it('ne contient que les champs attendus, dans l’ordre, sans id', () => {
    const payload = clientPayload({ id: 42, ...CLIENT_SAMPLE, extra: 'ignoré' })
    assert.deepEqual(Object.keys(payload), CLIENT_FIELDS)
    assert.equal('id' in payload, false)
    assert.equal('extra' in payload, false)
  })

  it('nettoie toutes les valeurs texte', () => {
    const payload = clientPayload({
      name: '  Atlas Distribution  ',
      company: '  Atlas SARL ',
      email: '  contact@atlas.dz ',
      phone: ' 0550 12 34 56 ',
      address: ' 12 rue Didouche Mourad, Alger ',
      nif: ' 123 456 789 012 345 ',
      rc: ' 16/00-1234567B12 ',
    })
    assert.deepEqual(payload, {
      name: 'Atlas Distribution',
      company: 'Atlas SARL',
      email: 'contact@atlas.dz',
      phone: '0550 12 34 56',
      address: '12 rue Didouche Mourad, Alger',
      nif: '123456789012345',
      rc: '16/00-1234567B12',
    })
  })

  it('renvoie des chaînes vides pour un formulaire vide ou absent', () => {
    const empty = { name: '', company: '', email: '', phone: '', address: '', nif: '', rc: '' }
    assert.deepEqual(clientPayload({}), empty)
    assert.deepEqual(clientPayload(undefined), empty)
  })

  it('convertit les valeurs non textuelles en chaînes', () => {
    assert.equal(clientPayload({ name: 'Atlas', phone: 550123456 }).phone, '550123456')
  })

  it('produit une charge utile validable telle quelle', () => {
    const payload = clientPayload({ name: 'Atlas', email: 'contact@atlas.dz', nif: '123 456 789 012 345' })
    assert.deepEqual(validateClient(payload), {})
  })
})
