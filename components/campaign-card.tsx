import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";
import { Progress } from "@/components/ui/progress";
import { useRouter } from "next/navigation";

interface CampaignCardProps {
  id: string;
  title: string;
  description: string;
  amountRaised: string;
  imageUrl: string;
  featured?: boolean;
  progress?: number;
}

export default function CampaignCard({
  id,
  title,
  description,
  amountRaised,
  imageUrl,
  featured = false,
  progress,
}: CampaignCardProps) {
  const router = useRouter();

  const handleClick = () => {
    router.push(`/campaign/${id}`);
  };

  return (
    <Card
      className={`overflow-hidden hover:shadow-lg transition-shadow cursor-pointer ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
      onClick={handleClick}
    >
      <div
        className={`relative bg-gray-100 ${
          featured ? "aspect-[2/2]" : "aspect-video"
        }`}
      >
        <Image
          src={imageUrl || "/placeholder.svg"}
          alt={title}
          fill
          className="object-cover"
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
          {title}
        </h3>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">{description}</p>
        {progress && <Progress value={progress} />}
        <div className="font-semibold text-[#6B8E5A]">${amountRaised}</div>
      </CardContent>
    </Card>
  );
}
