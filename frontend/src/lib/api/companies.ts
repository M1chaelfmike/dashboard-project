
import { apiRequest } from './client';

// ==================== Types ====================

export interface Company {
  companyCode: string;
  companyName: string;
  level: number;
  country: string;
  city: string;
  foundedYear: number;
  annualRevenue: number;
  employees: number;
  parentCompanyCode: string | null;
  parentCompanyName: string | null;
  parentCompanyLevel: number | null;
  revenueEfficiency: number | null;
}

export interface ListCompaniesParams {
  page?: number;
  pageSize?: number;
  search?: string;
  levels?: number[];
}

export interface CompaniesListResponse {
  items: Company[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CreateCompanyRequest {
  companyCode: string;
  companyName: string;
  level: number;
  country: string;
  city: string;
  foundedYear: number;
  annualRevenue: number;
  employees: number;
  parentCompanyCode: string;
}

export type UpdateCompanyRequest = Partial<
  Omit<CreateCompanyRequest, 'companyCode'>
>;

export interface DeleteCompanyResponse {
  message: string;
  companyCode: string;
}

// ==================== API ====================

// List companies
export async function getCompanies(
  params: ListCompaniesParams = {},
): Promise<CompaniesListResponse> {
  const query = new URLSearchParams();

  if (params.page !== undefined) {
    query.set('page', String(params.page));
  }

  if (params.pageSize !== undefined) {
    query.set('pageSize', String(params.pageSize));
  }

  if (params.search?.trim()) {
    query.set('search', params.search.trim());
  }

  if (params.levels?.length) {
    query.set('levels', params.levels.join(','));
  }

  const queryString = query.toString();

  return apiRequest<CompaniesListResponse>(
    `/companies${queryString ? `?${queryString}` : ''}`,
  );
}

// Get company details
export async function getCompanyByCode(
  companyCode: string,
): Promise<Company> {
  return apiRequest<Company>(
    `/companies/${encodeURIComponent(companyCode)}`,
  );
}

// Create company
export async function createCompany(
  data: CreateCompanyRequest,
): Promise<Company> {
  return apiRequest<Company>('/companies', {
    method: 'POST',
    body: data,
  });
}

// Update company
export async function updateCompany(
  companyCode: string,
  data: UpdateCompanyRequest,
): Promise<Company> {
  return apiRequest<Company>(
    `/companies/${encodeURIComponent(companyCode)}`,
    {
      method: 'PATCH',
      body: data,
    },
  );
}

// Delete company
export async function deleteCompany(
  companyCode: string,
): Promise<DeleteCompanyResponse> {
  return apiRequest<DeleteCompanyResponse>(
    `/companies/${encodeURIComponent(companyCode)}`,
    {
      method: 'DELETE',
    },
  );
}
