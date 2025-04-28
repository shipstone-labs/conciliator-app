import { formatDate, formatNumber, type IPDoc } from '@/lib/types'
import { Card, CardContent, CardHeader } from '../ui/card'
import Image from 'next/image'
import {
  getSortedPrices,
  type Price,
  type Product,
  useProducts,
} from '@/hooks/useProducts'
import { useCallback, useMemo, useState } from 'react'
import { useStytchUser } from '@stytch/nextjs'
import { ViewNDA } from '../ViewNDA'
import { Button } from '../ui/button'
import { useSession } from '../AuthLayout'

export type AmendedProduct = Product & {
  price: Price
  index: number
  duration: string
}

type MainCardProps = {
  ipDoc: IPDoc
  onBuy: (product: AmendedProduct) => void
}

export const MainCard = ({ ipDoc, onBuy }: MainCardProps) => {
  const products = useProducts()
  const [ndaChecked, setNdaChecked] = useState(false)
  const stytchUser = useStytchUser()
  const session = useSession()
  const requestLogin = useCallback(async () => {
    if (stytchUser.user) {
      return
    }
    await session.stytchUser.wait(true)
  }, [session, stytchUser.user])
  const ndaValid = useMemo(() => {
    return ndaChecked || !ipDoc.terms?.ndaRequired
  }, [ndaChecked, ipDoc.terms?.ndaRequired])
  const prices = useMemo<Array<AmendedProduct>>(() => {
    const {
      terms: { pricing = {} } = {},
    } = ipDoc || {}
    const prices: Array<AmendedProduct> = Object.values(pricing)
      .map(({ product, price, index, ...rest }) => {
        const productData = products[product]
        if (!productData) {
          return null
        }
        const priceData = productData.prices?.[price]
        if (!priceData) {
          return null
        }
        return {
          ...rest,
          ...productData,
          price: priceData,
          index,
        } as Product & { price: Price; index: number }
      })
      .filter(Boolean) as Array<AmendedProduct>
    const orders = ['day', 'week', 'month', 'year']
    if (prices.length === 0) {
      // Ignore them if they are empty for now
      for (const product of Object.values(products)) {
        if (
          product.metadata?.duration &&
          orders.indexOf(product.metadata?.duration) !== -1
        ) {
          prices.push({
            ...product,
            price: getSortedPrices(product.prices)[0],
            id: product.id,
            index: 0,
            duration: product.metadata?.duration,
          } as AmendedProduct)
        }
      }
    }
    prices.sort(
      (a, b) => orders.indexOf(a.duration) - orders.indexOf(b.duration)
    )
    return prices
  }, [products, ipDoc])
  return (
    <>
      {/* Main idea card - only show when not loading and no error */}
      <Card className="w-full backdrop-blur-lg bg-background/30 border border-white/10 shadow-xl overflow-hidden">
        <CardHeader className="pb-4 border-b border-white/10">
          <div className="flex flex-wrap gap-2 justify-center">
            {Array.isArray(ipDoc.tags) && ipDoc.tags.length > 0 ? (
              ipDoc.tags.map((tag, index) => (
                <span
                  key={index}
                  className="px-3 py-1 text-xs font-medium bg-white/10 text-white/80 rounded-full"
                >
                  {tag}
                </span>
              ))
            ) : (
              <span className="px-3 py-1 text-xs font-medium bg-white/10 text-white/60 rounded-full">
                Intellectual Property
              </span>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          <div>
            <h3 className="text-sm font-medium text-white/60 mb-2">
              Description
            </h3>
            <p className="text-white/90 leading-relaxed">
              {ipDoc.description || 'No description available.'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4">
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">
                Created On
              </h3>
              <p className="text-white/90">{formatDate(ipDoc.createdAt)}</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-white/60 mb-1">
                Category
              </h3>
              <p className="text-white/90">
                {ipDoc.category || 'Intellectual Property'}
              </p>
            </div>
          </div>

          {/* Access Terms Section - Show if terms information exists */}
          {ipDoc.terms && !ipDoc.deals?.length && (
            <div className="border-t border-white/10 pt-5 mt-5">
              <h3 className="text-lg font-medium text-primary mb-3">
                Access Terms
              </h3>

              <div className="space-y-4">
                {/* Business Model */}
                <div className="flex items-start gap-2">
                  <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                    <Image
                      src="/secure.svg"
                      alt="Business Model Icon"
                      width={32}
                      height={32}
                      priority
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/70">
                      Business Model:
                    </h4>
                    <p className="text-white/90">
                      {ipDoc.terms.businessModel ||
                        ipDoc.category ||
                        'Protected Evaluation'}
                    </p>
                  </div>
                </div>

                {/* Evaluation Period */}
                <div className="flex items-start gap-2">
                  <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                    <Image
                      src="/clock.svg"
                      alt="Evaluation Period Icon"
                      width={32}
                      height={32}
                      priority
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-white/70">
                      Evaluation Period:
                    </h4>
                    <p className="text-white/90">
                      {ipDoc.terms.evaluationPeriod ||
                        (Array.isArray(ipDoc.tags) && ipDoc.tags.length > 1
                          ? ipDoc.tags[1]
                          : 'Standard')}
                    </p>
                  </div>
                </div>

                {/* Access Options - Show if pricing information exists */}
                {stytchUser.user ? (
                  <>
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-white/70 mb-2">
                        Access Options:
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        {prices?.map((item: AmendedProduct) => (
                          <button
                            key={item.id}
                            type="button"
                            className={`p-3 border rounded-xl transition-all ${
                              ndaValid
                                ? 'border-primary/30 bg-muted/30 cursor-pointer hover:bg-muted/40 hover:scale-[1.02] hover:border-primary/50'
                                : 'border-white/10 bg-muted/20 opacity-50'
                            }`}
                            disabled={!ndaValid}
                            onClick={() => ndaValid && onBuy(item)}
                            role={ndaValid ? 'button' : ''}
                            tabIndex={ndaValid ? 0 : -1}
                          >
                            <p className="text-white/70 text-xs">{item.name}</p>
                            <p className="text-primary font-medium mt-1">
                              {item.price != null && item.price?.id !== ''
                                ? formatNumber(
                                    item.price.unit_amount / 100,
                                    'currency',
                                    item.price.currency
                                  )
                                : 'Not available'}
                            </p>
                          </button>
                        )) || null}
                      </div>
                    </div>
                    {/* NDA Information */}
                    <div className="mt-4 p-3 border border-white/20 rounded-xl bg-muted/20">
                      <div className="flex items-start gap-2">
                        <div className="bg-primary/20 p-3 rounded-full shrink-0 flex items-center justify-center">
                          <Image
                            src="/patent-law.svg"
                            alt="Document Icon"
                            width={32}
                            height={32}
                            priority
                          />
                        </div>
                        <div>
                          <p className="text-white/90 mb-2">
                            {ipDoc.terms.ndaRequired
                              ? 'NDA Required: Access to this idea requires a signed Non-Disclosure Agreement.'
                              : 'NDA Not Required: This idea can be accessed without a signed NDA.'}
                          </p>
                          {ipDoc.terms.ndaRequired && (
                            <>
                              <ViewNDA
                                businessModel={ipDoc.terms.businessModel}
                                variant="ghost"
                                size="sm"
                                className="text-primary font-medium"
                              >
                                Review NDA
                              </ViewNDA>
                              <div className="flex items-center mt-2">
                                <input
                                  type="checkbox"
                                  id="nda-confirmation"
                                  checked={ndaChecked}
                                  onChange={(e) =>
                                    setNdaChecked(e.target.checked)
                                  }
                                  className="mr-2 rounded border-white/20 bg-muted/30 text-primary"
                                />
                                <label
                                  htmlFor="nda-confirmation"
                                  className="text-white/80 text-sm"
                                >
                                  I have signed the required Non-Disclosure
                                  Agreement (NDA).
                                </label>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <h4 className="text-sm font-medium text-white/70 mb-2">
                    Please login to get access information.{' '}
                    <Button
                      variant="ghost"
                      className="text-primary font-medium"
                      onClick={requestLogin}
                    >
                      Login
                    </Button>
                  </h4>
                )}
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer buttons removed */}
      </Card>
    </>
  )
}
