
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import QRCodeGenerator from "@/components/QRCodeGenerator";

const QRCode = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500/20 to-blue-500/20 py-8 px-4">
      <div className="container max-w-lg mx-auto">
        <Link to="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour
          </Button>
        </Link>
        
        <Card>
          <CardHeader>
            <CardTitle>Mon QR Code</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <QRCodeGenerator action="transfer" showCard={false} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default QRCode;
