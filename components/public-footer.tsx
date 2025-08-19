import Link from "next/link"

export default function PublicFooter() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="text-[#6B8E5A] text-2xl font-bold italic mb-4">Fundflow</div>
            <p className="text-gray-600 text-sm">
              Fundflow is your all-in-one platform for discovering, tracking, and supporting fundraising campaigns
              across the globe.
            </p>
            <div className="flex space-x-2 mt-4">
              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                <img
                  src="images/discord-icon-svgrepo-com.svg"
                  alt="Discord"
                  className="w-10 h-10"
                />
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                <img
                  src="images/Instagram-Logo.wine.svg"
                  alt="Instagram"
                  className="w-10 h-10"
                />
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                <img
                  src="images/linkedin-svgrepo-com.svg"
                  alt="Ink"
                  className="w-7 h-7"
                />
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                <img
                  src="images/icons8-x.svg"
                  alt="X"
                  className="w-10 h-10"
                />
              </div>
              <div className="w-8 h-8 bg-gray-50 rounded flex items-center justify-center">
                <img
                  src="images/youtube-svgrepo-com.svg"
                  alt="YT"
                  className="w-10 h-10"
                />
              </div>
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Donate</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Crisis relief
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Social Impact Funds
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Supporter Space
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">Fundraise</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  How to start a Fundflow
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Fundraising categories
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Team fundraising
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Charity fundraising
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-gray-900 mb-4">About</h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  How Fundflow works
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Fundflow Giving Guarantee
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  About Fundflow
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-gray-500">
          <div>©2025 Fundflow</div>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <Link href="#" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link href="#" className="hover:text-gray-700">
              Terms
            </Link>
            <Link href="#" className="hover:text-gray-700">
              Cookie Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
