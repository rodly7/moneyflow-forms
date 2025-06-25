
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { formatCurrency } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Users, Plus, ArrowLeft } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface Agent {
  id: string;
  full_name: string;
  phone: string;
  balance: number;
  country: string;
}

interface BatchDepositData {
  agentId: string;
  amount: number;
}

interface BatchAgentDepositProps {
  onBack: () => void;
}

const BatchAgentDeposit = ({ onBack }: BatchAgentDepositProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [selectedAgents, setSelectedAgents] = useState<Set<string>>(new Set());
  const [depositMode, setDepositMode] = useState<'uniform' | 'individual'>('uniform');
  const [uniformAmount, setUniformAmount] = useState('');
  const [individualAmounts, setIndividualAmounts] = useState<Record<string, string>>({});
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch all agents
  const { data: agents, isLoading } = useQuery({
    queryKey: ['agents-for-batch-deposit'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, phone, balance, country')
        .eq('role', 'agent')
        .order('full_name');
      
      if (error) throw error;
      return data as Agent[];
    },
  });

  const handleAgentToggle = (agentId: string) => {
    const newSelected = new Set(selectedAgents);
    if (newSelected.has(agentId)) {
      newSelected.delete(agentId);
      // Remove individual amount if deselected
      const newAmounts = { ...individualAmounts };
      delete newAmounts[agentId];
      setIndividualAmounts(newAmounts);
    } else {
      newSelected.add(agentId);
    }
    setSelectedAgents(newSelected);
  };

  const handleSelectAll = () => {
    if (!agents) return;
    
    if (selectedAgents.size === agents.length) {
      setSelectedAgents(new Set());
      setIndividualAmounts({});
    } else {
      setSelectedAgents(new Set(agents.map(agent => agent.id)));
    }
  };

  const handleIndividualAmountChange = (agentId: string, amount: string) => {
    setIndividualAmounts(prev => ({
      ...prev,
      [agentId]: amount
    }));
  };

  const validateAmounts = (): BatchDepositData[] => {
    const deposits: BatchDepositData[] = [];
    
    for (const agentId of selectedAgents) {
      let amount: number;
      
      if (depositMode === 'uniform') {
        amount = Number(uniformAmount);
      } else {
        amount = Number(individualAmounts[agentId] || 0);
      }
      
      if (!amount || amount <= 0) {
        throw new Error(`Montant invalide pour l'agent`);
      }
      
      deposits.push({ agentId, amount });
    }
    
    return deposits;
  };

  const handleBatchDeposit = async () => {
    if (selectedAgents.size === 0) {
      toast({
        title: "Aucun agent sélectionné",
        description: "Veuillez sélectionner au moins un agent",
        variant: "destructive"
      });
      return;
    }

    try {
      const deposits = validateAmounts();
      const totalAmount = deposits.reduce((sum, deposit) => sum + deposit.amount, 0);
      
      // Verify admin/sub-admin has enough balance
      if (profile && profile.balance < totalAmount) {
        throw new Error(`Solde insuffisant. Total requis: ${formatCurrency(totalAmount, 'XAF')}`);
      }

      setIsProcessing(true);

      // Process deposits in sequence to maintain transaction integrity
      const results = [];
      let processedAmount = 0;

      for (const deposit of deposits) {
        try {
          // Debit admin/sub-admin
          const { error: debitError } = await supabase.rpc('increment_balance', {
            user_id: user?.id,
            amount: -deposit.amount
          });

          if (debitError) {
            throw new Error(`Erreur lors du débit: ${debitError.message}`);
          }

          // Credit agent
          const { error: creditError } = await supabase.rpc('increment_balance', {
            user_id: deposit.agentId,
            amount: deposit.amount
          });

          if (creditError) {
            // Rollback debit if credit fails
            await supabase.rpc('increment_balance', {
              user_id: user?.id,
              amount: deposit.amount
            });
            throw new Error(`Erreur lors du crédit: ${creditError.message}`);
          }

          // Create transaction record
          const agent = agents?.find(a => a.id === deposit.agentId);
          const transactionReference = `BATCH-${profile?.role?.toUpperCase()}-AGENT-DEP-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
          
          const { error: transactionError } = await supabase
            .from('recharges')
            .insert({
              user_id: deposit.agentId,
              amount: deposit.amount,
              country: profile?.country || "Congo Brazzaville",
              payment_method: `${profile?.role}_batch_agent_deposit`,
              payment_phone: agent?.phone || '',
              payment_provider: profile?.role || 'admin',
              transaction_reference: transactionReference,
              status: 'completed',
              provider_transaction_id: user?.id
            });

          if (transactionError) {
            console.error('Erreur transaction:', transactionError);
          }

          results.push({
            agentId: deposit.agentId,
            agentName: agent?.full_name,
            amount: deposit.amount,
            success: true
          });

          processedAmount += deposit.amount;

        } catch (error) {
          results.push({
            agentId: deposit.agentId,
            agentName: agents?.find(a => a.id === deposit.agentId)?.full_name,
            amount: deposit.amount,
            success: false,
            error: error instanceof Error ? error.message : 'Erreur inconnue'
          });
        }
      }

      // Show results
      const successful = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;

      if (successful > 0) {
        toast({
          title: "Dépôts en lot effectués",
          description: `${successful} agent(s) rechargé(s) avec succès. Total: ${formatCurrency(processedAmount, 'XAF')}${failed > 0 ? `. ${failed} échec(s).` : ''}`,
        });
      }

      if (failed > 0) {
        const failedAgents = results.filter(r => !r.success).map(r => r.agentName).join(', ');
        toast({
          title: "Certains dépôts ont échoué",
          description: `Agents concernés: ${failedAgents}`,
          variant: "destructive"
        });
      }

      // Reset form
      setSelectedAgents(new Set());
      setUniformAmount('');
      setIndividualAmounts({});

    } catch (error) {
      console.error('Erreur lors du dépôt en lot:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Erreur lors du dépôt en lot",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="text-center">Chargement des agents...</div>
        </CardContent>
      </Card>
    );
  }

  const selectedAgentsList = agents?.filter(agent => selectedAgents.has(agent.id)) || [];
  const totalAmount = depositMode === 'uniform' 
    ? Number(uniformAmount || 0) * selectedAgents.size
    : selectedAgentsList.reduce((sum, agent) => sum + Number(individualAmounts[agent.id] || 0), 0);

  return (
    <Card className="bg-white">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-gray-900">
            <Users className="w-5 h-5 text-blue-600" />
            Dépôt en Lot pour Agents
          </CardTitle>
          <Button onClick={onBack} variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Agent Selection */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <Label className="text-sm font-medium">Sélection des agents ({selectedAgents.size} sélectionné(s))</Label>
            <Button
              onClick={handleSelectAll}
              variant="outline"
              size="sm"
            >
              {selectedAgents.size === agents?.length ? 'Tout désélectionner' : 'Tout sélectionner'}
            </Button>
          </div>
          
          <div className="max-h-64 overflow-y-auto border rounded-lg p-3 space-y-2">
            {agents?.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedAgents.has(agent.id)}
                    onCheckedChange={() => handleAgentToggle(agent.id)}
                  />
                  <div>
                    <p className="font-medium text-sm text-gray-900">{agent.full_name}</p>
                    <p className="text-xs text-gray-600">{agent.phone}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-600">
                    {formatCurrency(agent.balance, 'XAF')}
                  </p>
                  <Badge variant="secondary" className="text-xs">Agent</Badge>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Deposit Mode Selection */}
        {selectedAgents.size > 0 && (
          <div>
            <Label className="text-sm font-medium mb-3 block">Mode de dépôt</Label>
            <div className="flex gap-4">
              <Button
                onClick={() => setDepositMode('uniform')}
                variant={depositMode === 'uniform' ? 'default' : 'outline'}
                size="sm"
              >
                Montant uniforme
              </Button>
              <Button
                onClick={() => setDepositMode('individual')}
                variant={depositMode === 'individual' ? 'default' : 'outline'}
                size="sm"
              >
                Montants individuels
              </Button>
            </div>
          </div>
        )}

        {/* Amount Input */}
        {selectedAgents.size > 0 && (
          <div className="space-y-4">
            {depositMode === 'uniform' ? (
              <div>
                <Label htmlFor="uniformAmount">Montant par agent (FCFA)</Label>
                <Input
                  id="uniformAmount"
                  type="number"
                  placeholder="Ex: 50000"
                  value={uniformAmount}
                  onChange={(e) => setUniformAmount(e.target.value)}
                />
              </div>
            ) : (
              <div>
                <Label className="text-sm font-medium mb-3 block">Montants individuels (FCFA)</Label>
                <div className="space-y-2 max-h-32 overflow-y-auto">
                  {selectedAgentsList.map((agent) => (
                    <div key={agent.id} className="flex items-center gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium">{agent.full_name}</p>
                      </div>
                      <Input
                        type="number"
                        placeholder="Montant"
                        className="w-32"
                        value={individualAmounts[agent.id] || ''}
                        onChange={(e) => handleIndividualAmountChange(agent.id, e.target.value)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Summary */}
        {selectedAgents.size > 0 && totalAmount > 0 && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-blue-800 mb-2">Résumé du dépôt</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p>• {selectedAgents.size} agent(s) sélectionné(s)</p>
              <p>• Montant total: <span className="font-semibold">{formatCurrency(totalAmount, 'XAF')}</span></p>
              <p>• Votre solde actuel: <span className="font-semibold">{formatCurrency(profile?.balance || 0, 'XAF')}</span></p>
              {profile && profile.balance < totalAmount && (
                <p className="text-red-600 font-semibold">⚠️ Solde insuffisant</p>
              )}
            </div>
          </div>
        )}

        {/* Action Button */}
        <Button
          onClick={handleBatchDeposit}
          disabled={isProcessing || selectedAgents.size === 0 || totalAmount <= 0 || (profile && profile.balance < totalAmount)}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          {isProcessing ? "Traitement en cours..." : `Effectuer les dépôts (${formatCurrency(totalAmount, 'XAF')})`}
        </Button>
      </CardContent>
    </Card>
  );
};

export default BatchAgentDeposit;
