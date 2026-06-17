export interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: 'draft' | 'pending' | 'paid' | 'overdue' | 'cancelled';
  dueDate: Date;
  issuedDate: Date;
  paidDate?: Date;
  notes?: string;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceItem {
  id: string;
  productId: string;
  productName: string;
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

export interface CreateInvoiceDTO {
  clientId: string;
  items: Omit<InvoiceItem, 'id' | 'total'>[];
  dueDate: Date;
  notes?: string;
  taxRate?: number;
}