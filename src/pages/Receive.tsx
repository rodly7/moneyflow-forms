import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const Receive = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-3xl mx-auto">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Recevoir de l'argent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Pour recevoir de l'argent, partagez ces informations avec l'expéditeur :
              </p>
            </div>
            
            {/* Cette section sera complétée avec les informations de réception */}
            <div className="space-y-4">
              <div>
                <p className="font-medium">Nom complet</p>
                <p className="text-sm text-muted-foreground">John Doe</p>
              </div>
              <div>
                <p className="font-medium">Pays</p>
                <p className="text-sm text-muted-foreground">France</p>
              </div>
              <div>
                <p className="font-medium">Téléphone</p>
                <p className="text-sm text-muted-foreground">+33 6 12 34 56 78</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Receive;