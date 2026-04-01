import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/hooks/useWallet';
import { useCreateCircle } from '@/hooks/useCircle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { 
  formatAmount,
  getCategoryLabel,
  getCategoryColor,
  getCircleTypeLabel,
  CircleCategory,
  CircleType,
} from '@/lib/constants';
import { 
  ArrowLeft, 
  ArrowRight, 
  CheckCircle, 
  Lock,
  Sparkles,
  Info,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';

const CIRCLE_TYPES = [
  { value: CircleType.OPEN, label: 'Open', description: 'Anyone can join' },
  { value: CircleType.APPROVAL_REQUIRED, label: 'Approval Required', description: 'Creator approves members' },
  { value: CircleType.INVITE_ONLY, label: 'Invite Only', description: 'By invitation only' },
];

const CATEGORIES = [
  { value: CircleCategory.FRIENDS, label: getCategoryLabel(CircleCategory.FRIENDS), color: getCategoryColor(CircleCategory.FRIENDS) },
  { value: CircleCategory.FAMILY, label: getCategoryLabel(CircleCategory.FAMILY), color: getCategoryColor(CircleCategory.FAMILY) },
  { value: CircleCategory.COWORKERS, label: getCategoryLabel(CircleCategory.COWORKERS), color: getCategoryColor(CircleCategory.COWORKERS) },
  { value: CircleCategory.NEIGHBORS, label: getCategoryLabel(CircleCategory.NEIGHBORS), color: getCategoryColor(CircleCategory.NEIGHBORS) },
  { value: CircleCategory.INTEREST, label: getCategoryLabel(CircleCategory.INTEREST), color: getCategoryColor(CircleCategory.INTEREST) },
];

const STEPS = [
  { id: 1, title: 'Basic Info', description: 'Name and description' },
  { id: 2, title: 'Settings', description: 'Amount and members' },
  { id: 3, title: 'Type', description: 'Access and collateral' },
  { id: 4, title: 'Review', description: 'Confirm and create' },
];

export function CreateCirclePage() {
  const navigate = useNavigate();
  const { isConnected } = useWallet();
  const { createCircle, isSubmitting, voyagerUrl, error: createError } = useCreateCircle();
  const [currentStep, setCurrentStep] = useState(1);
  
  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [monthlyAmount, setMonthlyAmount] = useState('100');
  const [maxMembers, setMaxMembers] = useState(10);
  const [circleType, setCircleType] = useState<number>(CircleType.OPEN);
  const [category, setCategory] = useState<number>(CircleCategory.FRIENDS);
  const [collateralRatio, setCollateralRatio] = useState(150);

  const totalPot = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(maxMembers) * BigInt(1e18);
  const collateralAmount = BigInt(Math.floor(parseFloat(monthlyAmount) || 0)) * BigInt(collateralRatio) / BigInt(100) * BigInt(1e18);

  const handleNext = () => {
    if (currentStep < STEPS.length) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleCreate = async () => {
    if (!isConnected) {
      toast.error('Please connect your wallet first');
      return;
    }

    const result = await createCircle({
      name,
      description,
      monthlyAmount,
      maxMembers,
      circleType,
      category,
      collateralRatio,
    });
    
    if (result) {
      toast.success(
        <div>
          Circle created successfully!{' '}
          <a href={result.voyagerUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">
            View on Voyager →
          </a>
        </div>
      );
      navigate('/circles');
    } else if (createError) {
      toast.error(createError);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1:
        return name.trim().length > 0 && description.trim().length > 0;
      case 2:
        return parseFloat(monthlyAmount) > 0 && maxMembers >= 2 && maxMembers <= 50;
      case 3:
        return true;
      default:
        return true;
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-[#FEFAE0] flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-28 h-28 bg-[#FFE66D] border-[3px] border-black mx-auto mb-6 flex items-center justify-center">
            <Lock className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-black mb-3">Connect Your Wallet</h2>
          <p className="text-gray-600 mb-6 text-lg">Please connect your wallet to create a circle.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FEFAE0]">
      {/* Header */}
      <div className="bg-white border-b-[2px] border-black">
        <div className="page-shell py-8 md:py-9">
          <button 
            onClick={() => navigate(-1)}
            className="animate-fade-in inline-flex items-center gap-2 font-bold text-gray-600 hover:text-black transition-colors mb-4 text-base"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <h1 className="animate-fade-in stagger-1 text-3xl md:text-4xl font-black">Create New Circle</h1>
          <p className="animate-fade-in stagger-2 text-gray-600 mt-2 text-lg">All data stored on Starknet • Verifiable on Voyager</p>
        </div>
      </div>

      <div className="page-shell py-8 md:py-10">
        <div className="max-w-4xl mx-auto">
          {/* Progress Steps */}
          <div className="animate-fade-in stagger-2 mb-10">
            <div className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className={`flex flex-col items-center ${index < STEPS.length - 1 ? 'flex-1' : ''}`}>
                    <div 
                      className={`w-12 h-12 border-[3px] border-black flex items-center justify-center font-black text-lg
                        ${currentStep > step.id ? 'bg-green-400' : 
                          currentStep === step.id ? 'bg-[#FF6B6B] text-white' : 
                          'bg-gray-200'}`}
                    >
                      {currentStep > step.id ? <CheckCircle className="w-6 h-6" /> : step.id}
                    </div>
                    <div className="mt-2 text-center hidden sm:block">
                      <p className="text-sm font-bold">{step.title}</p>
                      <p className="text-sm text-gray-500">{step.description}</p>
                    </div>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div className={`w-full h-[3px] mx-2 ${currentStep > step.id ? 'bg-green-400' : 'bg-gray-300'}`} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Form Content */}
          <div className="neo-card p-8 md:p-10 animate-fade-in stagger-3">
            {/* Step 1: Basic Info */}
            {currentStep === 1 && (
              <div className="space-y-7 animate-fade-in">
                <div>
                  <Label htmlFor="name" className="text-xl font-black mb-3 block">
                    Circle Name *
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g., Tech Workers Save"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="neo-input text-lg"
                    maxLength={31}
                  />
                  <p className="text-sm text-gray-500 mt-2">{name.length}/31 characters (stored on-chain as felt252)</p>
                </div>
                <div>
                  <Label htmlFor="description" className="text-xl font-black mb-3 block">
                    Description *
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the purpose of your circle..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="neo-input min-h-[140px] text-base"
                    maxLength={31}
                  />
                  <p className="text-sm text-gray-500 mt-2">{description.length}/31 characters (stored on-chain as felt252)</p>
                </div>
              </div>
            )}

            {/* Step 2: Settings */}
            {currentStep === 2 && (
              <div className="space-y-7 animate-fade-in">
                <div>
                  <Label htmlFor="amount" className="text-xl font-black mb-3 block">
                    Monthly Amount (STRK) *
                  </Label>
                  <div className="relative">
                    <Input
                      id="amount"
                      type="number"
                      min="1"
                      placeholder="100"
                      value={monthlyAmount}
                      onChange={(e) => setMonthlyAmount(e.target.value)}
                      className="neo-input text-lg pr-20"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-gray-500 text-base">
                      STRK
                    </span>
                  </div>
                </div>

                <div>
                  <Label className="text-xl font-black mb-4 block">
                    Maximum Members: <span className="text-[#FF6B6B]">{maxMembers}</span>
                  </Label>
                  <Slider
                    value={[maxMembers]}
                    onValueChange={(value) => setMaxMembers(value[0])}
                    min={2}
                    max={50}
                    step={1}
                    className="py-4"
                  />
                  <div className="flex justify-between text-base text-gray-600 mt-1">
                    <span>2 members</span>
                    <span>50 members</span>
                  </div>
                </div>

                <div className="bg-[#FEFAE0] border-[3px] border-black p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <Info className="w-6 h-6 text-[#4ECDC4]" />
                    <span className="font-bold text-lg">Total Pot Size</span>
                  </div>
                  <p className="text-3xl font-black">{formatAmount(totalPot)}</p>
                  <p className="text-base text-gray-600 mt-1">Each member receives this when it's their turn.</p>
                </div>
              </div>
            )}

            {/* Step 3: Type */}
            {currentStep === 3 && (
              <div className="space-y-7 animate-fade-in">
                <div>
                  <Label className="text-xl font-black mb-4 block">Circle Type *</Label>
                  <div className="grid md:grid-cols-3 gap-4">
                    {CIRCLE_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setCircleType(type.value)}
                        className={`p-5 border-[3px] text-left transition-all
                          ${circleType === type.value 
                            ? 'border-[#FF6B6B] bg-[#FF6B6B]/10' 
                            : 'border-black hover:bg-gray-50'}`}
                      >
                        <p className="font-bold text-lg">{type.label}</p>
                        <p className="text-base text-gray-600 mt-1">{type.description}</p>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <Label className="text-xl font-black mb-4 block">Category *</Label>
                  <Select value={category.toString()} onValueChange={(v) => setCategory(Number(v))}>
                    <SelectTrigger className="neo-input">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="border-[3px] border-black">
                      {CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value.toString()}>
                          <div className="flex items-center gap-2">
                            <div 
                              className="w-3 h-3 border border-black" 
                              style={{ backgroundColor: cat.color }}
                            />
                            {cat.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label className="text-xl font-black mb-4 block">
                    Collateral Ratio: <span className="text-[#FF6B6B]">{collateralRatio / 100}x</span>
                  </Label>
                  <Slider
                    value={[collateralRatio]}
                    onValueChange={(value) => setCollateralRatio(value[0])}
                    min={100}
                    max={255}
                    step={5}
                    className="py-4"
                  />
                  <div className="flex justify-between text-base text-gray-600 mt-1">
                    <span>1.0x (100%)</span>
                    <span>2.55x (255%)</span>
                  </div>
                  <div className="mt-5 bg-[#FEFAE0] border-[3px] border-black p-5">
                    <div className="flex items-center gap-2 mb-2">
                      <Lock className="w-6 h-6 text-[#FFE66D]" />
                      <span className="font-bold text-lg">Required Collateral per Member</span>
                    </div>
                    <p className="text-3xl font-black">{formatAmount(collateralAmount)}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Step 4: Review */}
            {currentStep === 4 && (
              <div className="space-y-7 animate-fade-in">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-[#FF6B6B] border-[3px] border-black mx-auto mb-4 flex items-center justify-center animate-scale-in">
                    <Sparkles className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-3xl font-black">Review Your Circle</h3>
                  <p className="text-gray-600 text-lg mt-1">This will create a smart contract on Starknet Sepolia</p>
                </div>

                <div className="space-y-0">
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Name</span>
                    <span className="font-black text-lg">{name}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Monthly Amount</span>
                    <span className="font-black text-lg">{monthlyAmount} STRK</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Max Members</span>
                    <span className="font-black text-lg">{maxMembers}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Type</span>
                    <span className="font-black text-lg">{getCircleTypeLabel(circleType)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Category</span>
                    <span className="font-black text-lg">{getCategoryLabel(category)}</span>
                  </div>
                  <div className="flex justify-between py-4 border-b-[2px] border-gray-200">
                    <span className="font-bold text-gray-600 text-lg">Collateral</span>
                    <span className="font-black text-lg">{collateralRatio / 100}x ({formatAmount(collateralAmount)})</span>
                  </div>
                  <div className="flex justify-between py-4 bg-[#FEFAE0] border-[3px] border-black px-5 mt-4">
                    <span className="font-bold text-lg">Total Pot Size</span>
                    <span className="font-black text-[#FF6B6B] text-lg">{formatAmount(totalPot)}</span>
                  </div>
                </div>

                {voyagerUrl && (
                  <div className="bg-green-100 border-[3px] border-green-500 p-5 flex items-center gap-3 animate-scale-in">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                    <div>
                      <p className="font-bold text-green-800 text-lg">Circle Created!</p>
                      <a href={voyagerUrl} target="_blank" rel="noopener noreferrer" className="text-base text-green-700 underline flex items-center gap-1">
                        View on Voyager <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between mt-10 pt-7 border-t-[3px] border-black">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStep === 1}
                className="border-[3px] border-black font-bold px-8 py-4 text-base"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Back
              </Button>
              
              {currentStep < STEPS.length ? (
                <Button
                  onClick={handleNext}
                  disabled={!canProceed()}
                  className="neo-button-primary px-8"
                >
                  Next
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleCreate}
                  disabled={isSubmitting}
                  className="neo-button-primary px-10"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-5 h-5 mr-2 animate-spin" /> Creating on-chain...</>
                  ) : (
                    <>Create Circle <Sparkles className="w-5 h-5 ml-2" /></>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
