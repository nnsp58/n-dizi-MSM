import { useState } from 'react';
import { useAuthStore } from '@/store/auth-store';
import { useOperatorsStore, Operator } from '@/store/operators-store';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PWAUtils } from '@/lib/pwa-utils';

export default function Operators() {
  const { user } = useAuthStore();
  const { operators, addOperator, updateOperator, deleteOperator } = useOperatorsStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingOperator, setEditingOperator] = useState<Operator | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'operator',
  });

  const maxOperators = 5;
  const canAddMore = operators.length < maxOperators;

  const handleAddOperator = () => {
    if (!formData.name.trim()) {
      PWAUtils.showToast('Please enter operator name', 'error');
      return;
    }

    const newOperator: Operator = {
      id: Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      role: formData.role,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    addOperator(newOperator);
    setFormData({ name: '', email: '', phone: '', role: 'operator' });
    setShowAddModal(false);
    PWAUtils.showToast('Operator added successfully', 'success');
  };

  const handleUpdateOperator = () => {
    if (!editingOperator || !formData.name.trim()) {
      PWAUtils.showToast('Please enter operator name', 'error');
      return;
    }

    updateOperator(editingOperator.id, formData);
    setEditingOperator(null);
    setFormData({ name: '', email: '', phone: '', role: 'operator' });
    PWAUtils.showToast('Operator updated successfully', 'success');
  };

  const handleToggleStatus = (id: string) => {
    const operator = operators.find(op => op.id === id);
    if (operator) {
      updateOperator(id, { isActive: !operator.isActive });
      PWAUtils.showToast('Status updated', 'success');
    }
  };

  const handleDeleteOperator = (id: string) => {
    deleteOperator(id);
    PWAUtils.showToast('Operator removed', 'success');
  };

  const handleEdit = (operator: Operator) => {
    setEditingOperator(operator);
    setFormData({
      name: operator.name,
      email: operator.email || '',
      phone: operator.phone || '',
      role: operator.role,
    });
  };

  return (
    <div className="p-4 md:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-foreground">Operators Management</h1>
          <p className="text-sm md:text-base text-muted-foreground mt-1">
            Manage your store staff and track their performance
          </p>
        </div>
        <Button
          onClick={() => setShowAddModal(true)}
          disabled={!canAddMore}
          data-testid="button-add-operator"
          className="flex items-center gap-2"
        >
          <i className="fas fa-user-plus"></i>
          Add Operator
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Total Operators</p>
                <p className="text-3xl font-bold text-blue-900 dark:text-blue-100 mt-1">
                  {operators.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-users text-white text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active</p>
                <p className="text-3xl font-bold text-green-900 dark:text-green-100 mt-1">
                  {operators.filter(op => op.isActive).length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-check-circle text-white text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-900/20 dark:to-amber-800/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-amber-600 dark:text-amber-400 font-medium">Available Slots</p>
                <p className="text-3xl font-bold text-amber-900 dark:text-amber-100 mt-1">
                  {maxOperators - operators.length}
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-500 rounded-lg flex items-center justify-center">
                <i className="fas fa-user-clock text-white text-xl"></i>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operators List</CardTitle>
        </CardHeader>
        <CardContent>
          {operators.length > 0 ? (
            <div className="space-y-3">
              {operators.map((operator) => (
                <div
                  key={operator.id}
                  data-testid={`operator-${operator.id}`}
                  className="flex items-center gap-4 p-4 rounded-lg border hover:bg-muted transition-colors"
                >
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <i className="fas fa-user text-primary text-xl"></i>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold text-foreground">{operator.name}</p>
                      <Badge variant={operator.isActive ? 'default' : 'secondary'}>
                        {operator.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                      {operator.email && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-envelope"></i>
                          {operator.email}
                        </span>
                      )}
                      {operator.phone && (
                        <span className="flex items-center gap-1">
                          <i className="fas fa-phone"></i>
                          {operator.phone}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <i className="fas fa-briefcase"></i>
                        {operator.role}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(operator)}
                      data-testid={`button-edit-${operator.id}`}
                    >
                      <i className="fas fa-edit"></i>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleToggleStatus(operator.id)}
                      data-testid={`button-toggle-${operator.id}`}
                    >
                      <i className={`fas fa-${operator.isActive ? 'toggle-on' : 'toggle-off'}`}></i>
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeleteOperator(operator.id)}
                      data-testid={`button-delete-${operator.id}`}
                      className="text-destructive"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="fas fa-users text-4xl text-muted-foreground"></i>
              </div>
              <p className="font-medium text-foreground mb-1">No operators added yet</p>
              <p className="text-sm text-muted-foreground mb-4">
                Add your first operator to start tracking sales by staff
              </p>
              <Button onClick={() => setShowAddModal(true)} data-testid="button-add-first">
                <i className="fas fa-user-plus mr-2"></i>
                Add Your First Operator
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {!canAddMore && (
        <Card className="border-amber-500 bg-amber-50 dark:bg-amber-900/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <i className="fas fa-info-circle text-amber-600 dark:text-amber-400 text-xl"></i>
              <div>
                <p className="font-medium text-amber-900 dark:text-amber-100">
                  Maximum operators limit reached
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  You can have up to {maxOperators} operators. Remove an existing operator to add a new one.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={showAddModal || editingOperator !== null} onOpenChange={(open) => {
        if (!open) {
          setShowAddModal(false);
          setEditingOperator(null);
          setFormData({ name: '', email: '', phone: '', role: 'operator' });
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingOperator ? 'Edit Operator' : 'Add New Operator'}
            </DialogTitle>
            <DialogDescription>
              {editingOperator 
                ? 'Update operator details below' 
                : 'Enter operator details to add them to your store'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="Enter operator name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                data-testid="input-operator-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="operator@example.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                data-testid="input-operator-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+91 1234567890"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                data-testid="input-operator-phone"
              />
            </div>
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => setFormData({ ...formData, role: value })}
              >
                <SelectTrigger data-testid="select-operator-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operator">Operator</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="supervisor">Supervisor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-3 pt-4">
              <Button
                onClick={editingOperator ? handleUpdateOperator : handleAddOperator}
                className="flex-1"
                data-testid="button-save-operator"
              >
                {editingOperator ? 'Update' : 'Add'} Operator
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddModal(false);
                  setEditingOperator(null);
                  setFormData({ name: '', email: '', phone: '', role: 'operator' });
                }}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
