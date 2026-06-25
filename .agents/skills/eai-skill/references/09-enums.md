# Enums da API EAÍ

Listagem de todos os enums e tipos discriminados usados pela API.

### `accountingAccountKind`
Default: `akCreditor`

- `akCreditor`
- `akDebtor`

### `accountingAccountType`
Default: `atSynthetic`

- `atSynthetic`
- `atAnalytic`

### `accountingBalanceSheetGroup`
_- bsUnspecified: Default value required in proto3
 - bsCurrentAssets: ASSETS - ATIVO
Current Assets - Ativo Circulante

Ativo Circulante
 - bsCashAndCashEquivalents: Disponibilidades
 - bsAccountsReceivable: Contas a Receber
 - bsInventory: Estoques
 - bsPrepaidExpenses: Despesas Antecipadas
 - bsOtherCurrentAssets: Outros Ativos Circulantes
 - bsNonCurrentAssets: Non-Current Assets - Ativo Não Circulante

Ativo Não Circulante
 - bsLongTermReceivables: Realizável a Longo Prazo
 - bsInvestments: Investimentos
 - bsPropertyPlantEquipment: Imobilizado
 - bsIntangibleAssets: Intangível
 - bsCurrentLiabilities: LIABILITIES - PASSIVO
Current Liabilities - Passivo Circulante

Passivo Circulante
 - bsAccountsPayable: Fornecedores
 - bsShortTermLoans: Empréstimos e Financiamentos
 - bsPayrollLiabilities: Obrigações Trabalhistas
 - bsTaxLiabilities: Obrigações Tributárias
 - bsProvisions: Provisões
 - bsOtherCurrentLiabilities: Outras Obrigações Circulantes
 - bsNonCurrentLiabilities: Non-Current Liabilities - Passivo Não Circulante

Passivo Não Circulante
 - bsLongTermLoans: Empréstimos e Financiamentos de Longo Prazo
 - bsLongTermProvisions: Provisões de Longo Prazo
 - bsOtherLongTermLiabilities: Outras Obrigações de Longo Prazo
 - bsEquity: EQUITY - PATRIMÔNIO LÍQUIDO

Patrimônio Líquido
 - bsShareCapital: Capital Social
 - bsCapitalReserves: Reservas de Capital
 - bsRevaluationAdjustments: Ajustes de Avaliação Patrimonial
 - bsRetainedEarnings: Reservas de Lucros
 - bsTreasuryShares: Ações em Tesouraria
 - bsAccumulatedLosses: Prejuízos Acumulados_
Default: `bsUnspecified`

- `bsUnspecified`
- `bsCurrentAssets`
- `bsCashAndCashEquivalents`
- `bsAccountsReceivable`
- `bsInventory`
- `bsPrepaidExpenses`
- `bsOtherCurrentAssets`
- `bsNonCurrentAssets`
- `bsLongTermReceivables`
- `bsInvestments`
- `bsPropertyPlantEquipment`
- `bsIntangibleAssets`
- `bsCurrentLiabilities`
- `bsAccountsPayable`
- `bsShortTermLoans`
- `bsPayrollLiabilities`
- `bsTaxLiabilities`
- `bsProvisions`
- `bsOtherCurrentLiabilities`
- `bsNonCurrentLiabilities`
- `bsLongTermLoans`
- `bsLongTermProvisions`
- `bsOtherLongTermLiabilities`
- `bsEquity`
- `bsShareCapital`
- `bsCapitalReserves`
- `bsRevaluationAdjustments`
- `bsRetainedEarnings`
- `bsTreasuryShares`
- `bsAccumulatedLosses`

### `accountingIncomeStatementGroup`
Default: `isgUnspecified`

- `isgUnspecified`
- `isgGrossRevenue`
- `isgGrossRevenueDeductions`
- `isgNetSalesRevenue`
- `isgCostOfSales`
- `isgOperatingExpenses`
- `isgOtherRevenuesExpenses`
- `isgEarningsBeforeIncomeTax`
- `isgIncomeTaxProvision`
- `isgNetIncome`

### `catalogPriceListType`
Default: `pltNormal`

- `pltNormal`
- `pltRelativePercentage`
- `pltRelativeValue`

### `commonActiveInactive`
Default: `Inactive`

- `Inactive`
- `Active`

### `commonFilterOperator`
Default: `foEqual`

- `foEqual`
- `foNot_Equal`
- `foLike`
- `foLike_Insensitive`
- `foIs_Null`
- `foIs_Not_Null`
- `foLess_Than`
- `foLess_Than_Equal`
- `foGreater_Than`
- `foGreater_Than_Equal`

### `commonFinancialOperationType`
Default: `fotPercentage`

- `fotPercentage`
- `fotFixedValue`

### `commonPaymentMethodType`
Default: `mtNone`

- `mtNone`
- `mtCurrency`
- `mtCreditCard`
- `mtDebitCard`
- `mtBankDraft`
- `mtPix`
- `mtBillet`
- `mtDraft`
- `mtCheckout`
- `mtVoucher`

### `commonPersonType`
Default: `Individual`

- `Individual`
- `Entity`
- `Foreigner`
- `Unknown`

### `commonPersonTypeTelecom`
Default: `ptlNone`

- `ptlNone`
- `ptlComercial`
- `ptlIndustrial`
- `ptlResidencial`
- `ptlProdutorRural`
- `ptlOrgaoPublico`
- `ptlPrestadorTelecom`
- `ptlMissoesDiplomaticas`
- `ptlIgrejas`
- `ptlComercialMesmaNatureza`
- `ptlOutros`

### `eaiBillingType`
Default: `btExternalPayment`

- `btExternalPayment`
- `btInternalPayment`

### `eaiInternetAmountUnity`
Default: `iauMegabyte`

- `iauMegabyte`
- `iauGigabyte`

### `eaiMvnoBonusType`
Default: `mbtSignature`

- `mbtSignature`
- `mbtPortability`

### `eaiMvnoCartInvoiceOrigin`
Default: `mcioNone`

- `mcioNone`
- `mcioInternal`
- `mcioArqia`

### `eaiMvnoCartOrigin`
Default: `mcoApi`

- `mcoApi`
- `mcoAdmin`
- `mcoAdminContractActivation`
- `mcoRecurrence`
- `mcoPortalCustomer`

### `eaiMvnoCartStatus`
Default: `mcsNone`

- `mcsNone`
- `mcsPending`
- `mcsCanceled`
- `mcsProcessed`
- `mcsPaid`

### `eaiMvnoCartType`
Default: `mctActivation`

- `mctActivation`
- `mctRecharge`
- `mctRecurrence`

### `eaiMvnoLinePlanItemType`
Default: `mlpitRecharge`

- `mlpitRecharge`
- `mlpitSignatureBonus`
- `mlpitPortabilityBonus`
- `mlpitInternetPromotionBonus`
- `mlpitVoicePromotionBonus`
- `mlpitSmsPromotionBonus`

### `eaiMvnoLinePortabilityStatus`
Default: `mpsPending`

- `mpsPending`
- `mpsSent`
- `mpsCanceled`
- `mpsSuccess`
- `mpsError`
- `mpsCancelPending`

### `eaiMvnoLineRecurrence`
Default: `mlrNone`

- `mlrNone`
- `mlrRecurrencePrePaid`
- `mlrRecurrencPostPaid`

### `eaiMvnoLineStatus`
Default: `mlsNone`

- `mlsNone`
- `mlsActive`
- `mlsInactive`
- `mlsWaitingPortability`
- `mlsCanceled`
- `mlsPorted`
- `mlsPortout`
- `mlsBlocked`
- `mlsSuspended`
- `mlsQuarantine`

### `eaiMvnoPlanFinality`
Default: `mpfActivation`

- `mpfActivation`
- `mpfPlanChange`
- `mpfRecharge`
- `mpfRecurrence`

### `eaiMvnoPlanIsValidFinality`
Default: `mpvfValid`

- `mpvfValid`
- `mpvfInvalidNotFound`
- `mpvfInvalidInactiveEai`
- `mpvfInvalidInactiveReseller`
- `mpvfInvalidFinality`
- `mpvfInvalidDifferentMainProduct`

### `eaiMvnoSimCardStatus`
Default: `mscsNew`

- `mscsNew`
- `mscsReserved`
- `mscsActive`

### `financialBillCategoryType`
Default: `bctRevenue`

- `bctRevenue`
- `bctExpense`

### `mvnoMsisdnType`
Default: `mtNormalNumber`

- `mtNormalNumber`
- `mtGoldenNumber`
- `mtDummyNumber`

### `v1eaiMvnoPlanType`
Default: `mptControl`

- `mptControl`
- `mptRecharge`
- `mptAdditional`
